"use client";

import Image from "next/image";

const LoginLogo = () => {
  return (
    <>
      {/* Dark Logo */}
      <Image
        src="/images/logos/logo-icon.jpg"
        alt="logo"
        width={100}
        height={80}
        className="block dark:hidden rtl:scale-x-[-1]"
      />
      {/* Light Logo */}
      <Image
        src="/images/logos/dark-logo.png"
        alt="logo"
        width={150}
        height={100}
        className="hidden dark:block rtl:scale-x-[-1]"
      />
    </>
  );
};

export default LoginLogo;
