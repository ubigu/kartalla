interface Props {
  lastItem?: boolean;
}

export function FollowUpListItemIcon({ lastItem = true }: Props) {
  if (lastItem)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1 1V11V12H2H11.2676C11.6134 12.5978 12.2597 13 13 13C14.1046 13 15 12.1046 15 11C15 9.89543 14.1046 9 13 9C12.2597 9 11.6134 9.4022 11.2676 10H3V1H1Z"
          fill="#6C6D6E"
        />
      </svg>
    );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 0V10V20H3V11H11.2676C11.6134 11.5978 12.2597 12 13 12C14.1046 12 15 11.1046 15 10C15 8.89543 14.1046 8 13 8C12.2597 8 11.6134 8.4022 11.2676 9H3V0H1Z"
        fill="#6C6D6E"
      />
    </svg>
  );
}
