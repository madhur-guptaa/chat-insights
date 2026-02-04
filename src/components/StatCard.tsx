import {LucideIcon} from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant?: 'default' | 'positive' | 'negative' | 'accent';
    delay?: number;
}

export function StatCard({
                             title,
                             value,
                             subtitle,
                             icon: Icon,
                             variant = 'default',
                             delay = 0
                         }: StatCardProps) {
    const variantStyles = {
        default: 'from-primary/10 to-primary/5',
        positive: 'from-positive/10 to-positive/5',
        negative: 'from-negative/10 to-negative/5',
        accent: 'from-accent/10 to-accent/5',
    };

    const iconStyles = {
        default: 'text-primary',
        positive: 'text-positive',
        negative: 'text-negative',
        accent: 'text-accent',
    };

    return (
        <div
            className="stat-card fade-in"
            style={{animationDelay: `${delay}ms`}}
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${variantStyles[variant]} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${iconStyles[variant]}`}/>
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <p className="text-3xl font-bold text-foreground">{value}</p>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
