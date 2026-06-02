<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class WatchTokenService
{
    private const SEGMENT_SECONDS       = 30;
    private const TIMING_TOLERANCE_EARLY = 5;   // tolérance avant fin de segment
    private const TIMING_BUFFER_LATE    = 60;   // tolérance après fin de segment
    private const NONCE_TTL_EXTRA       = 120;  // TTL cache = durée segment + cette valeur

    private function secret(): string
    {
        $key = config('app.key');
        if (str_starts_with($key, 'base64:')) {
            return base64_decode(substr($key, 7));
        }
        return $key;
    }

    /**
     * Génère un token signé HMAC-SHA256 pour un segment de visionnage.
     * Encode : user, video, bornes du segment, timestamp d'émission, nonce unique.
     */
    public function generate(int $userId, int $videoId, int $segmentStart, int $videoDuration): array
    {
        if ($segmentStart >= $videoDuration) {
            throw new \InvalidArgumentException('segment_start dépasse la durée de la vidéo.');
        }

        $segmentEnd = min($segmentStart + self::SEGMENT_SECONDS, $videoDuration);
        $nonce      = bin2hex(random_bytes(16));
        $issuedAt   = now()->unix();

        $payload = [
            'uid'       => $userId,
            'vid'       => $videoId,
            'seg_start' => $segmentStart,
            'seg_end'   => $segmentEnd,
            'iat'       => $issuedAt,
            'nonce'     => $nonce,
        ];

        $encoded   = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $encoded, $this->secret());
        $token     = $encoded . '.' . $signature;

        $duration = $segmentEnd - $segmentStart;
        Cache::put(
            "watch_nonce:{$nonce}",
            'pending',
            now()->addSeconds($duration + self::NONCE_TTL_EXTRA)
        );

        return [
            'token'      => $token,
            'seg_start'  => $segmentStart,
            'seg_end'    => $segmentEnd,
            'expires_at' => now()->addSeconds($duration + self::NONCE_TTL_EXTRA)->toIso8601String(),
        ];
    }

    /**
     * Valide un token et retourne son payload.
     * Lance une RuntimeException descriptive en cas d'échec.
     */
    public function validate(string $token, int $userId): array
    {
        $parts = explode('.', $token, 2);
        if (count($parts) !== 2) {
            throw new \RuntimeException('Format de token invalide.');
        }

        [$encoded, $signature] = $parts;

        $expected = hash_hmac('sha256', $encoded, $this->secret());
        if (!hash_equals($expected, $signature)) {
            throw new \RuntimeException('Signature de token invalide.');
        }

        $payload = json_decode(base64_decode($encoded), true);
        if (!is_array($payload)) {
            throw new \RuntimeException('Payload de token corrompu.');
        }

        if (($payload['uid'] ?? null) !== $userId) {
            throw new \RuntimeException('Token lié à un autre utilisateur.');
        }

        $nonceKey    = "watch_nonce:{$payload['nonce']}";
        $nonceStatus = Cache::get($nonceKey);

        if ($nonceStatus === null) {
            throw new \RuntimeException('Token expiré.');
        }
        if ($nonceStatus === 'used') {
            throw new \RuntimeException('Replay détecté : token déjà consommé.');
        }

        $duration    = $payload['seg_end'] - $payload['seg_start'];
        $minSubmitAt = $payload['iat'] + $duration - self::TIMING_TOLERANCE_EARLY;
        $maxSubmitAt = $payload['iat'] + $duration + self::TIMING_BUFFER_LATE;
        $now         = now()->unix();

        if ($now < $minSubmitAt) {
            $wait = $minSubmitAt - $now;
            throw new \RuntimeException("Heartbeat soumis trop tôt — attendez encore {$wait}s.");
        }
        if ($now > $maxSubmitAt) {
            throw new \RuntimeException('Token expiré (délai de soumission dépassé).');
        }

        return $payload;
    }

    /**
     * Marque le nonce comme consommé pour bloquer tout replay ultérieur.
     */
    public function consume(string $nonce): void
    {
        Cache::put("watch_nonce:{$nonce}", 'used', now()->addSeconds(300));
    }
}
