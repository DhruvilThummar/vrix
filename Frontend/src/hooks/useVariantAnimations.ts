import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { RefObject } from "react";

export function useVariantAnimations(
  imageRef: RefObject<HTMLElement | null>,
  priceRef: RefObject<HTMLElement | null>,
  activeVariant: any
) {
  useGSAP(() => {
    if (!imageRef.current) return;
    gsap.fromTo(
      imageRef.current,
      { opacity: 0, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
    );
  }, { dependencies: [activeVariant?.image], revertOnUpdate: true });

  useGSAP(() => {
    if (!priceRef.current) return;
    gsap.fromTo(
      priceRef.current,
      { scale: 1 },
      { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" }
    );
  }, { dependencies: [activeVariant?.price], revertOnUpdate: true });
}
