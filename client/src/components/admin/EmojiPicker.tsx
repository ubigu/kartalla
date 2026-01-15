import { Box, IconButton, Typography } from '@mui/material';
import { useTranslations } from '@src/stores/TranslationContext';
import { EmojiPicker as Frimousse } from 'frimousse';

interface Props {
  onSelect?: (value: string | null) => void;
}

export function EmojiPicker({ onSelect }: Props) {
  const { tr, language } = useTranslations();
  return (
    <Frimousse.Root
      locale={language === 'se' ? 'sv' : language}
      onEmojiSelect={({ emoji }) => {
        onSelect(emoji);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 'fit-content',
        height: '352px',
        isolation: 'isolate',
      }}
    >
      <Frimousse.Search
        autoFocus
        placeholder={tr.EmojiPicker.search}
        style={{
          position: 'relative',
          zIndex: 10,
          appearance: 'none',
          marginBlockStart: '8px',
          marginInline: '8px',
          padding: '8px 10px',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      <Frimousse.Viewport
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          flex: 1,
          alignItems: 'space-between',
        }}
      >
        <Frimousse.Loading
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          {tr.EmojiPicker.loading}
        </Frimousse.Loading>
        <Frimousse.Empty
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          {tr.EmojiPicker.empty}
        </Frimousse.Empty>
        <Frimousse.List
          style={{ userSelect: 'none' }}
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.8rem',
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                }}
                {...props}
              >
                {category.label}
              </Typography>
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Emoji: ({ emoji, color, ...props }) => (
              <IconButton size="small" sx={{ color: 'black' }} {...props}>
                {emoji.emoji}
              </IconButton>
            ),
            Row: ({ children, ...props }) => (
              <Box sx={{ marginInline: '0.5rem' }} {...props}>
                {children}
              </Box>
            ),
          }}
        ></Frimousse.List>
        <Frimousse.ActiveEmoji>
          {({ emoji }) => (
            <Box
              position="sticky"
              bottom="0"
              sx={{
                background: 'white',
                padding: '0.5rem 0.8rem',
                fontSize: '0.8rem',
              }}
            >
              {emoji ? (
                <>
                  {emoji.emoji} {emoji.label}
                </>
              ) : (
                tr.EmojiPicker.selectEmoji
              )}
            </Box>
          )}
        </Frimousse.ActiveEmoji>
      </Frimousse.Viewport>
    </Frimousse.Root>
  );
}
