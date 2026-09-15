import chicagoDawgs from '@/assets/logos/chicago-dawgs.png';
import sylvanParkForresters from '@/assets/logos/sylvan-park-forresters.jpg';
import sanDiegoGamblers from '@/assets/logos/san-diego-gamblers.webp.asset.json';
import geronimos from '@/assets/logos/abbottabad-geronimos.webp.asset.json';
import queenCityHarambes from '@/assets/logos/queen-city-harambes.png';
import franklinFanatics from '@/assets/logos/franklin-fanatics.jpg';
import nashvilleKats from '@/assets/logos/nashville-kats.png';
import austinAreaBrockParty from '@/assets/logos/austin-area-brock-party.webp.asset.json';
import maryWashingtonFireAnts from '@/assets/logos/mary-washington-fire-ants.jpg';
import nepoBeachGuppies from '@/assets/logos/nepo-beach-guppies.png';
import { cn } from '@/lib/utils';

// Map team names to their logo imports (supports both with and without "The" prefix)
const teamLogos: Record<string, string> = {
  // Without "The" prefix (database format)
  'Chicago Dawgs': chicagoDawgs,
  'Sylvan Park Forresters': sylvanParkForresters,
  'San Diego Gamblers': sanDiegoGamblers.url,
  'Germantown Gamblers': sanDiegoGamblers.url,
  'Abbottabad Geronimos': geronimos.url,
  'Queen City Harambes': queenCityHarambes,
  'Franklin Fanatics': franklinFanatics,
  'Nashville Kats': nashvilleKats,
  'Austin Area Brock Party': austinAreaBrockParty.url,
  'Miami Area Ken Francis Experience': austinAreaBrockParty.url,
  'West NY Mary Washington Fire Ants': maryWashingtonFireAnts,
  'Nepo Beach Guppies': nepoBeachGuppies,
  // With "The" prefix (local leagueData format)
  'The Chicago Dawgs': chicagoDawgs,
  'The Sylvan Park Forresters': sylvanParkForresters,
  'The San Diego Gamblers': sanDiegoGamblers.url,
  'The Germantown Gamblers': sanDiegoGamblers.url,
  'The Abbattabad Geronimos': geronimos.url,
  'The Abbottabad Geronimos': geronimos.url,
  'The Queen City Harambes': queenCityHarambes,
  'The Franklin Fanatics': franklinFanatics,
  'The Nashville Kats': nashvilleKats,
  'The Austin Area Brock Party': austinAreaBrockParty.url,
  'The Miami Area Ken Francis Experience': austinAreaBrockParty.url,
  'The Florida Area Ken Francis Experience': austinAreaBrockParty.url,
  'The West NY Mary Washington Fire Ants': maryWashingtonFireAnts,
  'The Nepo Beach Guppies': nepoBeachGuppies,
};

interface TeamLogoProps {
  teamName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TeamLogo = ({ teamName, size = 'md', className }: TeamLogoProps) => {
  const logoUrl = teamLogos[teamName];
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (!logoUrl) {
    // Fallback to initials if no logo found
    const initials = teamName
      .replace(/^The\s+/i, '') // Remove "The" prefix
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    
    return (
      <div 
        className={cn(
          'flex-shrink-0 rounded-full bg-muted flex items-center justify-center font-display font-bold text-muted-foreground',
          sizeClasses[size],
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-xs',
          size === 'lg' && 'text-sm',
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={`${teamName} logo`}
      className={cn(
        'flex-shrink-0 rounded-full object-cover',
        sizeClasses[size],
        className
      )}
    />
  );
};

export const getTeamLogo = (teamName: string): string | undefined => {
  return teamLogos[teamName];
};
