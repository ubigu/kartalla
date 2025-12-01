import {
  Box,
  Chip,
  ChipProps,
  Drawer,
  FormHelperText,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@src/components/icons/CloseIcon';
import React, { ReactNode, useState } from 'react';
import SplitPane from 'react-split-pane';

const SplitPaneTyped = SplitPane as React.ComponentType<any>;

interface Props {
  mainPane: ReactNode;
  sidePane: ReactNode | false;
  mobileDrawer: {
    open: boolean;
    setOpen: (open: boolean) => void;
    chipProps: ChipProps;
    title: string;
    helperText: string;
  };
  defaultSize?: string;
  height?: string;
}

export default function SplitPaneLayout({
  mainPane,
  sidePane,
  mobileDrawer,
  height,
}: Props) {
  const [isResizing, setIsResizing] = useState(false);
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        width: '100%',
        height: height ?? '100vh',
        display: 'flex',
      }}
    >
      {/* Side pane doesn't exist on any page - show the page in 1 column */}
      {sidePane == null && (
        <div
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          {mainPane}
        </div>
      )}
      {/* Desktop: side pane exists */}
      {mdUp && sidePane != null && (
        <SplitPaneTyped
          split="vertical"
          style={{ position: 'static' }}
          minSize={200}
          maxSize={-200}
          // Allow scrolling for the stepper pane
          pane1Style={{
            overflowY: 'auto',
            width: '600px',
            borderRight: '1px solid #00000033',
          }}
          // Dirty hack to fix iframe resizing issues with the split pane library
          // Issue: https://github.com/tomkp/react-split-pane/issues/361
          // Workaround: https://github.com/tomkp/react-split-pane/issues/241#issuecomment-677091968
          pane2Style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
          allowResize={false}
          onDragStarted={() => setIsResizing(true)}
          onDragFinished={() => setIsResizing(false)}
        >
          {mainPane}
          {sidePane || <div />}
        </SplitPaneTyped>
      )}
      {/* Mobile: side pane exists but current page has none */}
      {!mdUp && sidePane === false && (
        <>
          <div>{mainPane}</div>
          <div style={{ flexGrow: 1 }} />
        </>
      )}
      {/* Mobile: side pane exists and current page has some - render the drawer and the button to show it */}
      {!mdUp && sidePane != null && sidePane !== false && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '70px',
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          <Paper
            elevation={0}
            style={{
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              zIndex: 1,
            }}
          >
            <Chip
              {...mobileDrawer.chipProps}
              onClick={() => {
                mobileDrawer.setOpen(true);
              }}
            />
          </Paper>
          <Drawer
            anchor="top"
            open={mobileDrawer.open}
            onClose={() => {
              mobileDrawer.setOpen(false);
            }}
            PaperProps={{
              style: {
                height: 'calc(100% - 100px)',
              },
            }}
            ModalProps={{
              keepMounted: true,
            }}
          >
            <Paper
              elevation={3}
              style={{
                minHeight: '4rem',
                padding: '1rem',
                zIndex: 10,
                position: 'sticky',
                top: 0,
              }}
            >
              <IconButton
                style={{ float: 'right' }}
                onClick={() => {
                  mobileDrawer.setOpen(false);
                }}
              >
                <CloseIcon />
              </IconButton>
              {mobileDrawer.title && (
                <>
                  <Typography>{mobileDrawer.title}</Typography>
                  <FormHelperText>{mobileDrawer.helperText}</FormHelperText>
                </>
              )}
            </Paper>
            <div style={{ flexGrow: 1, position: 'relative' }}>{sidePane}</div>
          </Drawer>
          <div style={{ marginTop: 50, width: '100%' }}>{mainPane}</div>
        </Box>
      )}
    </Box>
  );
}
