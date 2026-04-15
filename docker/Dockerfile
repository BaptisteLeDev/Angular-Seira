FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    bash \
    git \
    curl \
    unzip \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    mariadb-client \
    autoconf \
    g++ \
    make \
    linux-headers

RUN docker-php-ext-install pdo_mysql intl bcmath zip opcache

RUN pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html