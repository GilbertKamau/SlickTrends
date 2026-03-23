import React from 'react';
import Image from 'next/image';

interface LogoProps {
    size?: number;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = "" }) => {
    return (
        <Image
            src="/logo.svg"
            alt="Slick Trends Logo"
            width={size}
            height={size}
            className={className}
            priority
        />
    );
};

export default Logo;
