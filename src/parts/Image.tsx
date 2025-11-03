import { Image as BootstrapImage } from 'react-bootstrap';

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Image({ src, alt, className, style }: ImageProps) {
  return (
    <BootstrapImage
      src={src}
      alt={alt}
      className={className}
      style={style}
    />
  );
}