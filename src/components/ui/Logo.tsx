import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Big Ben Base */}
            <rect x="25" y="65" width="30" height="25" fill="#4B518E" />
            <rect x="29" y="68" width="3" height="22" fill="#2D305D" />
            <rect x="36" y="68" width="3" height="22" fill="#2D305D" />
            <rect x="43" y="68" width="3" height="22" fill="#2D305D" />
            <rect x="50" y="68" width="3" height="22" fill="#2D305D" />

            {/* Clock Section */}
            <rect x="23" y="42" width="34" height="23" fill="#4B518E" />
            <circle cx="40" cy="53" r="8" fill="#75C78B" />
            <path d="M40 53 L40 49 M40 53 L43 53" stroke="#2D305D" strokeWidth="2" strokeLinecap="round" />

            {/* Spire */}
            <path d="M26 42 L40 20 L54 42 Z" fill="#4B518E" />
            <path d="M39 12 L39 20 L41 20 L41 12 Z" fill="#4B518E" />
            <polygon points="40,8 38,12 42,12" fill="#4B518E" />

            {/* Bar Chart Base */}
            <rect x="60" y="78" width="40" height="12" fill="#F89B5F" />

            {/* Bars */}
            <rect x="63" y="62" width="13" height="16" fill="#F89B5F" />
            <rect x="82" y="45" width="13" height="33" fill="#F89B5F" />

            {/* Checkmark Arrow */}
            <path d="M 100 25 
               L 100 40
               L 92 40
               L 65 67
               L 53 55
               L 57 51
               L 65 59
               L 88 36
               L 88 25
               Z" fill="#75C78B" />
        </svg>
    );
}
