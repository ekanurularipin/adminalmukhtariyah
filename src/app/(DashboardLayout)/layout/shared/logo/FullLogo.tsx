"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <>
      {/* Dark Logo */}
      <Image
        src="/images/logos/logo-icon.jpg"
        alt="logo"
        width={60}
        height={40}
        className="block dark:hidden rtl:scale-x-[-1]"
      />
      {/* Light Logo */}
      <Image
        src="/images/logos/dark-logo.png"
        alt="logo"
        width={60}
        height={40}
        className="hidden dark:block rtl:scale-x-[-1]"
      />
    </>
  );
};

export default FullLogo;
