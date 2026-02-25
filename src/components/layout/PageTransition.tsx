import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    pageKey: string;
}

export function PageTransition({ children, pageKey }: Props) {
    return (
        <motion.div
            key={pageKey}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
