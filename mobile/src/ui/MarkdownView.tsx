import { Linking } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { colors, fonts } from '@src/constants/theme';

type Props = {
  children: string;
};

export function MarkdownView({ children }: Props) {
  return (
    <Markdown
      style={markdownStyles}
      onLinkPress={(url) => {
        void Linking.openURL(url);
        return true;
      }}
    >
      {children}
    </Markdown>
  );
}

const TEXT = colors.onSurface;
const MUTED = colors.onSurfaceVariant;
const PRIMARY = colors.primary;
const BORDER = colors.overlayLight;
const CODE_BG = colors.overlayLighter;

const markdownStyles = {
  body: { color: TEXT, fontSize: 16, lineHeight: 26 },
  heading1: {
    color: TEXT,
    fontSize: 26,
    fontWeight: '800' as const,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heading2: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 10,
  },
  heading3: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading4: { color: TEXT, fontSize: 16, fontWeight: '700' as const, marginTop: 12, marginBottom: 6 },
  heading5: { color: MUTED, fontSize: 14, fontWeight: '700' as const, marginTop: 10, marginBottom: 4 },
  heading6: { color: MUTED, fontSize: 13, fontWeight: '700' as const, marginTop: 8, marginBottom: 4 },
  paragraph: { color: TEXT, fontSize: 16, lineHeight: 26, marginTop: 0, marginBottom: 12 },
  strong: { color: TEXT, fontWeight: '700' as const },
  em: { color: TEXT, fontStyle: 'italic' as const },
  link: { color: PRIMARY, textDecorationLine: 'underline' as const },
  blockquote: {
    backgroundColor: colors.primaryTint,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 10,
    borderRadius: 8,
  },
  bullet_list: { marginVertical: 8 },
  ordered_list: { marginVertical: 8 },
  list_item: { color: TEXT, marginVertical: 2 },
  bullet_list_icon: { color: PRIMARY, marginLeft: 4, marginRight: 8 },
  ordered_list_icon: { color: PRIMARY, marginLeft: 4, marginRight: 8, fontWeight: '700' as const },
  code_inline: {
    color: PRIMARY,
    backgroundColor: CODE_BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  code_block: {
    color: TEXT,
    backgroundColor: CODE_BG,
    padding: 12,
    borderRadius: 10,
    fontFamily: fonts.mono,
    fontSize: 13,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fence: {
    color: TEXT,
    backgroundColor: CODE_BG,
    padding: 12,
    borderRadius: 10,
    fontFamily: fonts.mono,
    fontSize: 13,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  hr: { backgroundColor: BORDER, height: 1, marginVertical: 16 },
  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, marginVertical: 10 },
  thead: { backgroundColor: colors.overlayLightest },
  th: { padding: 8, color: TEXT, fontWeight: '700' as const },
  td: { padding: 8, color: TEXT },
  tr: { borderBottomWidth: 1, borderColor: BORDER },
  image: { borderRadius: 8, marginVertical: 8 },
};
