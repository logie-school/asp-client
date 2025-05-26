import { SectionWrapper } from "../section-wrapper";

interface GalleryProps {
  active?: boolean;
}

export function Gallery({ active }: GalleryProps) {
  return (
    <div className="w-full h-full flex flex-row absolute">
      <SectionWrapper active={active}>

        <div className="w-full h-full flex items-center justify-center">
          <span className="opacity-50">work in progress</span>
        </div>

      </SectionWrapper>
    </div>
  );
}