const lightTheme = {
    primary: "#0077B6", 
    secondary: "#F77F00", 
    background: "#FFFFFF",
    cardBackground: "#F8F9FA", 
    text: "#E0E0E0",
    success: "#2D6A4F",
    warning: "#F4A261", 
  };
  
  const darkTheme = {
    primary: "#0077B6", 
    secondary: "#F77F00", 
    background: "#FFFFFF",
    cardBackground: "#F8F9FA", 
    text: "#E0E0E0",
    success: "#2D6A4F",
    warning: "#F4A261", 
  };
  
  const getTheme = (isDarkMode: boolean) => (isDarkMode ? darkTheme : lightTheme);
  
  export { getTheme, lightTheme, darkTheme };
  export default getTheme;