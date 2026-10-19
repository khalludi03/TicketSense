import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const label = resolvedTheme === 'dark' ? 'Switch theme (currently dark)' : 'Switch theme (currently light)';

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={label} title={label} className="text-foreground/80 hover:text-foreground hover:bg-muted">
      {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
