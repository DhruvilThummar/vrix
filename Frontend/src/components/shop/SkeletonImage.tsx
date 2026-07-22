"use client";
import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonImageProps extends Omit<ImageProps, "onLoad"> {
  wrapperClassName?: string;
}

export default function SkeletonImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  fill,
  width,
  height,
  ...props
}: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden w-full h-full ${wrapperClassName}`}>
      {/* Skeleton overlay shown until image is loaded */}
      {!loaded && (
        <div className="absolute inset-0 z-10 bg-soft-linen/50 animate-pulse">
          <Skeleton 
            className="w-full h-full min-h-[inherit]" 
            containerClassName="w-full h-full block leading-none" 
            height="100%"
            borderRadius="0px"
          />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-500 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
