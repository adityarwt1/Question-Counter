import Image from "next/image";
import React from "react";

const ImageTest = () => {
  return (
    <div>
      <Image 
        alt="normal test image" 
        src="https://raw.githubusercontent.com/adityarwt1/Question-Counter/refs/heads/main/public/image.png"
        width={400}
        height={500}
      />
    </div>
  );
};

export default ImageTest;
