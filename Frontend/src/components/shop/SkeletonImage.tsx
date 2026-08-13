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
      {/* Smooth Skeleton Pulse Overlay */}
      {!loaded && (
        <div className="absolute inset-0 z-10 bg-[#FAF8F5] animate-pulse">
          <Skeleton 
            className="w-full h-full min-h-[inherit]" 
            containerClassName="w-full h-full block leading-none" 
            height="100%"
            borderRadius="0px"
            baseColor="#FAF8F5"
            highlightColor="#EBEAE4"
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
        loading={props.priority ? "eager" : (props.loading || "lazy")}
        className={`transition-all duration-700 ease-out ${
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-xs"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
