import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  LogOut,
  Shield,
  Clock,
  UserCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  variant?: 'compact' | 'full' | 'header';
}

const UserProfile = ({ variant = 'compact' }: UserProfileProps) => {
  const { user, logout } = useAuth();

  // Default fallback if no user data
  const currentUser = {
    firstName: user?.firstName || 'User',
    surName: user?.lastName || '',
    role: 'Staff',
    department: 'ICU',
    shift: 'Day Shift',
    badge: 'N/A',
    email: user?.email || '',
    lastLogin: new Date().toLocaleString(),
    avatar: null // Will use initials
  };

  const getInitials = (firstName: string, surName: string) => {
    const first = firstName.charAt(0) || 'U';
    const last = surName.charAt(0) || '';
    return `${first}${last}`;
  };

  const handleLogout = () => {
    logout();
  };

  if (variant === 'header') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar || undefined} />
            <AvatarFallback className="bg-medical text-white text-sm" style={{ backgroundColor: '#64549f' }}>
              {getInitials(currentUser.firstName, currentUser.surName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left hidden md:block">
            <div className="text-sm font-medium text-white">
              {currentUser.firstName} {currentUser.surName}
            </div>
            <div className="text-xs text-white">
              {currentUser.role}
            </div>
          </div>
        </div>
        <LogOut className="w-5 h-5 cursor-pointer" id="signOutBtn" color='white' onClick={handleLogout} />

      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar || undefined} />
              <AvatarFallback className="bg-medical-primary text-white text-sm">
                {getInitials(currentUser.firstName, currentUser.surName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium">
                {currentUser.firstName} {currentUser.surName}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentUser.role}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar || undefined} />
                <AvatarFallback className="bg-medical-primary text-white">
                  {getInitials(currentUser.firstName, currentUser.surName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {currentUser.firstName} {currentUser.surName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentUser.email}
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="px-2 py-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Shield className="w-3 h-3" />
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="secondary" className="text-xs">
                {currentUser.role}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <UserCircle className="w-3 h-3" />
              <span className="text-muted-foreground">Department:</span>
              <span>{currentUser.department}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span className="text-muted-foreground">Shift:</span>
              <span>{currentUser.shift}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Badge:</span>
              <span className="font-mono">{currentUser.badge}</span>
            </div>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-medical-muted/20">
      <Avatar className="h-12 w-12">
        <AvatarImage src={currentUser.avatar || undefined} />
        <AvatarFallback className="bg-medical-primary text-white">
          {getInitials(currentUser.firstName, currentUser.surName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-medium text-lg">
          {currentUser.firstName} {currentUser.surName}
        </div>
        <div className="text-sm text-muted-foreground">
          {currentUser.role} • {currentUser.department}
        </div>
        <div className="flex items-center gap-4 mt-1">
          <Badge variant="secondary" className="text-xs">
            {currentUser.shift}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Badge: {currentUser.badge}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;