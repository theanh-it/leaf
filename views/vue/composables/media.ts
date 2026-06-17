export const useMedia = () => {
  const apiBase = import.meta.env.VITE_API_URL as string;

  const getLinkImage = (name: string) => {
    return `${apiBase}/files/images/${name}`;
  };

  return {
    getLinkImage,
  };
};
