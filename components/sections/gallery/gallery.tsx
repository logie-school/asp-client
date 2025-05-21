import { SectionWrapper } from "../section-wrapper";

interface GalleryProps {
  active?: boolean;
}

export function Gallery({ active }: GalleryProps) {
  return (
    <div className="w-full h-full flex flex-row absolute">
      <SectionWrapper active={active}>
        test
      </SectionWrapper>
    </div>
  );
}