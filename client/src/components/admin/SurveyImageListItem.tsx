import { File } from '@interfaces/survey';
import { CircularProgress, ImageListItem } from '@mui/material';
import CancelIcon from '@src/components/icons/CancelIcon';
import { getFileName } from '@src/utils/path';
import { useState } from 'react';

interface Props {
  image: File;
  src: string;
  altText: string;
  onClick: Function;
  onDelete: Function;
}

export default function SurveyImageListItem(props: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const image = props.image;

  return (
    <ImageListItem>
      <CancelIcon
        color="error"
        style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          fontSize: '26px',
          cursor: 'pointer',
        }}
        onClick={async (event) => await props.onDelete(event, image.fileUrl)}
      />
      <img
        src={props.src}
        srcSet={props.src}
        alt={props.altText || `survey-image-${getFileName(image.fileUrl)}`}
        loading="lazy"
        style={{
          height: '100%',
          objectFit: 'contain',
          visibility: isLoading ? 'hidden' : 'visible',
          cursor: 'pointer',
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setIsLoading(false);
        }}
        onClick={() => props.onClick(image.fileUrl)}
      />
      {isLoading && (
        <span
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress style={{ color: '#00a393' }} />
        </span>
      )}
    </ImageListItem>
  );
}
