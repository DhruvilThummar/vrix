declare module "next/link" {
  import React from "react";
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
  }
  const Link: React.ComponentType<React.PropsWithChildren<LinkProps>>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): {
    push(href: string, options?: any): void;
    replace(href: string, options?: any): void;
    forward(): void;
    back(): void;
    prefetch(href: string): void;
    refresh(): void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams(): Record<string, string | string[]>;
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module "next/image" {
  import React from "react";
  export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | any;
    alt: string;
    width?: number | `${number}`;
    height?: number | `${number}`;
    fill?: boolean;
    quality?: number | `${number}`;
    priority?: boolean;
    loading?: "eager" | "lazy";
    placeholder?: "blur" | "empty";
    blurDataURL?: string;
    unoptimized?: boolean;
    sizes?: string;
  }
  const Image: React.ComponentType<ImageProps>;
  export default Image;
}
