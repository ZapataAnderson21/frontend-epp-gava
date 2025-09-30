import React from 'react'

interface ButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  bgColor: string;
  bgHoverColor: string;
}

function Button({ icon, label, onClick, bgColor, bgHoverColor }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = bgHoverColor}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = bgColor}
      className="cursor-pointer px-4 py-2 rounded-md shadow-sm transition-colors
                 font-bold flex flex-row gap-2 items-center text-white"
    >
      {icon && icon}
      <span>{label}</span>
    </button>
  );
}


export default Button