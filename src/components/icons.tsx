import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M2 22V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14H2z" />
            <path d="M6 18h12" />
            <path d="M10 18v-4h4v4" />
            <path d="M10 10V6" />
            <path d="M14 10V6" />
            <path d="M18 10V6" />
            <path d="M6 10V6" />
        </svg>
    );
}
