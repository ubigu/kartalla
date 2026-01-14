import { File } from '@interfaces/survey';
import { useState } from 'react';
import SurveyImageList from './SurveyImageList';

interface Props {
  canEdit?: boolean;
}

export function SurveyMarginImageList({ canEdit = true }: Props) {
  const [images, setImages] = useState<File[]>([]);

  return (
    <>
      <SurveyImageList
        imageType={'topMarginImage'}
        images={images}
        setImages={setImages}
        canEdit={canEdit}
      />
      <SurveyImageList
        imageType={'bottomMarginImage'}
        images={images}
        setImages={setImages}
        canEdit={canEdit}
      />
    </>
  );
}
