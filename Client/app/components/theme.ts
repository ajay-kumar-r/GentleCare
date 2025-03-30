const lightTheme = {
    primary: "#0077B6", 
    secondary: "#F77F00", 
    background: "#FFFFFF",
    cardBackground: "#F8F9FA", 
    text: "#1E1E1E",
    success: "#2D6A4F",
    warning: "#F4A261", 
  };
  
  const darkTheme = {
    primary: "#90E0EF", 
    secondary: "#FF9F1C",
    background: "#121212", 
    cardBackground: "#1E1E1E", 
    text: "#E0E0E0",
    success: "#74C69D", 
    warning: "#EE9B00", 
  };
  
  const getTheme = (isDarkMode: boolean) => (isDarkMode ? darkTheme : lightTheme);
  
  export { getTheme, lightTheme, darkTheme };
  export default getTheme;