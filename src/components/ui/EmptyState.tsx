import { FileHeart } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-surface/30 backdrop-blur-md rounded-2xl border border-white/5 my-6 mx-4 shadow-xl">
            <div className="w-16 h-16 mb-4 rounded-full bg-surface flex items-center justify-center text-textMuted shadow-inner ring-1 ring-white/10">
                {icon || <FileHeart size={32} strokeWidth={1.5} />}
            </div>
            <h3 className="text-lg font-semibold text-textPrimary mb-1">{title}</h3>
            <p className="text-sm text-textSecondary leading-relaxed max-w-[250px]">
                {description}
            </p>
        </div>
    );
}
