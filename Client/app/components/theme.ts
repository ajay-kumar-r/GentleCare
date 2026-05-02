const lightTheme = {
  primary: "#0077B6",
  secondary: "#F77F00",
  background: "#F8FAFC",
  cardBackground: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A6270",
  success: "#2D6A4F",
  warning: "#F4A261",
  error: "#D32F2F",
  surface: "#FFFFFF",
  border: "#E2E8F0",
};

const darkTheme = {
  primary: "#4FC3F7",
  secondary: "#FFB74D",
  background: "#0F172A",
  cardBackground: "#1E293B",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  surface: "#1E293B",
  border: "#334155",
};

const getTheme = (isDarkMode: boolean) => (isDarkMode ? darkTheme : lightTheme);

export { getTheme, lightTheme, darkTheme };
export default getTheme;