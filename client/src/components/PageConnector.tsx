import { Theme } from '@mui/material';

interface PageConnectorProps {
  activePage: number;
  pageIndex: number;
  theme: Theme;
}

export default function PageConnector({
  activePage,
  pageIndex,
  theme,
}: PageConnectorProps) {
  return (
    <div style={{ marginLeft: '12px', flex: '1 1 auto' }}>
      <span
        style={{
          display: 'block',
          borderLeft: `${
            activePage === pageIndex
              ? `3px solid ${theme.palette.primary.main}`
              : '2px solid grey'
          }`,
          minHeight: '24px',
        }}
      ></span>
    </div>
  );
}
