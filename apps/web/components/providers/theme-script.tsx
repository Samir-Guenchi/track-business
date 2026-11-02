/**
 * Applies the saved or system theme before the first paint so dark mode never flashes.
 * The script is a fixed string with no user input.
 */
const script = `(function(){try{var t=localStorage.getItem('trackecom-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
