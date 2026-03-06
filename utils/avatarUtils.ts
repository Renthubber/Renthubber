export const getAvatarUrl = (user: any): string => {
  // Se ha avatar reale (non ui-avatars), usalo
  if (user?.avatar_url && !user.avatar_url.includes('ui-avatars.com')) {
    return user.avatar_url;
  }
  
  if (user?.avatar && !user.avatar.includes('ui-avatars.com')) {
    return user.avatar;
  }

  // Prova a estrarre nome e cognome
  let firstName = user?.first_name || user?.firstName || '';
  let lastName = user?.last_name || user?.lastName || '';
  
  // Se non ci sono, prova dal campo "name" o "public_name"
  if (!firstName && !lastName) {
    const fullName = user?.public_name || user?.name || '';
    const parts = fullName.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.length > 1 ? parts[parts.length - 1] : '';
  }
  
  // Se lastName è solo una lettera (es. "P."), prendila senza punto
  if (lastName && lastName.length <= 2) {
    lastName = lastName.replace('.', '');
  }
  
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  
  // ✨ Palette azzurro → verde acqua (coerente con brand)
  const colors = ['0891b2', '06b6d4', '22d3ee', '14b8a6', '2dd4bf', '10b981', '34d399', '3b82f6', '60a5fa'];
  const userId = user?.id || user?.email || initials;
  const colorIndex = userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&bold=true&size=128&font-size=0.4`;
};