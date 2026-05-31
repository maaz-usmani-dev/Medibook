const initialsFromName = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

export default function Avatar({ src, name = 'User', className = 'w-9 h-9', textClassName = 'text-sm', rounded = true }) {
  const shape = rounded ? 'rounded-full' : '';
  if (src) {
    return <img src={src} alt={name} className={`${className} ${shape} object-cover`} />;
  }

  return (
    <div className={`${className} ${shape} bg-blue-light text-blue grid place-items-center font-semibold ${textClassName}`}>
      {initialsFromName(name)}
    </div>
  );
}

export { initialsFromName };
