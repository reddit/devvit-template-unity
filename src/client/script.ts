// Type definitions for Unity WebGL
type UnityBannerType = 'error' | 'warning' | 'info';

type UnityConfig = {
  arguments: string[];
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl: string;
  companyName: string;
  productName: string;
  productVersion: string;
  showBanner: (msg: string, type: UnityBannerType) => void;
  matchWebGLToCanvasSize?: boolean;
  autoSyncPersistentDataPath?: boolean;
  devicePixelRatio?: number;
};

type UnityInstance = {
  SetFullscreen: (fullscreen: number) => void;
  SendMessage: (objectName: string, methodName: string, value?: string | number) => void;
  Quit: () => Promise<void>;
};

// Declare Unity loader function that will be loaded from external script
declare function createUnityInstance(
  canvas: HTMLCanvasElement,
  config: UnityConfig,
  onProgress?: (progress: number) => void
): Promise<UnityInstance>;

const canvas = document.querySelector<HTMLCanvasElement>("#unity-canvas");

if (!canvas) {
  throw new Error("Unity canvas element not found");
}

// Shows a temporary message banner/ribbon for a few seconds, or
// a permanent error message on top of the canvas if type=='error'.
// If type=='warning', a yellow highlight color is used.
// Modify or remove this function to customize the visually presented
// way that non-critical warnings and error messages are presented to the
// user.
function unityShowBanner(msg: string, type: UnityBannerType): void {
  const warningBanner = document.querySelector<HTMLElement>("#unity-warning");
  
  if (!warningBanner) {
    console.error("Warning banner element not found");
    return;
  }
  
  const banner = warningBanner; // Create a const reference for closure
  
  function updateBannerVisibility(): void {
    banner.style.display = banner.children.length ? 'block' : 'none';
  }
  
  const div = document.createElement('div');
  div.innerHTML = msg;
  warningBanner.appendChild(div);
  
  if (type === 'error') {
    div.style.cssText = 'background: red; padding: 10px;';
  } else {
    if (type === 'warning') {
      div.style.cssText = 'background: yellow; padding: 10px;';
    }
    setTimeout(() => {
      warningBanner.removeChild(div);
      updateBannerVisibility();
    }, 5000);
  }
  updateBannerVisibility();
}

const buildUrl = "Build";
const loaderUrl = buildUrl + "/SampleGame.loader.js";
const config: UnityConfig = {
  arguments: [],
  dataUrl: buildUrl + "/SampleGame.data.unityweb",
  frameworkUrl: buildUrl + "/SampleGame.framework.js",
  codeUrl: buildUrl + "/SampleGame.wasm.unityweb",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "DefaultCompany",
  productName: "SampleGame",
  productVersion: "0.1.0",
  showBanner: unityShowBanner,
  // errorHandler: function(err, url, line) {
  //    alert("error " + err + " occurred at line " + line);
  //    // Return 'true' if you handled this error and don't want Unity
  //    // to process it further, 'false' otherwise.
  //    return true;
  // },
};

      // By default, Unity keeps WebGL canvas render target size matched with
      // the DOM size of the canvas element (scaled by window.devicePixelRatio)
      // Set this to false if you want to decouple this synchronization from
      // happening inside the engine, and you would instead like to size up
      // the canvas DOM size and WebGL render target sizes yourself.
      // config.matchWebGLToCanvasSize = false;

      // If you would like all file writes inside Unity Application.persistentDataPath
      // directory to automatically persist so that the contents are remembered when
      // the user revisits the site the next time, uncomment the following line:
      // config.autoSyncPersistentDataPath = true;
      // This autosyncing is currently not the default behavior to avoid regressing
      // existing user projects that might rely on the earlier manual
      // JS_FileSystem_Sync() behavior, but in future Unity version, this will be
      // expected to change.

if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  // Mobile device style: fill the whole browser client area with the game canvas:

  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
  document.getElementsByTagName('head')[0]?.appendChild(meta);
  
  const container = document.querySelector<HTMLElement>("#unity-container");
  if (container) {
    container.className = "unity-mobile";
  }
  canvas.className = "unity-mobile";

  // To lower canvas resolution on mobile devices to gain some
  // performance, uncomment the following line:
  // config.devicePixelRatio = 1;

} else {
  // Desktop style: Render the game canvas in a window that can be maximized to fullscreen:
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const container = document.querySelector<HTMLElement>("#unity-container");
  if (container) {
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.transform = "none";
  }
}

const loadingBar = document.querySelector<HTMLElement>("#unity-loading-bar");
if (loadingBar) {
  loadingBar.style.display = "block";
}

const script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
  createUnityInstance(canvas, config, (progress: number) => {
    const progressBarFull = document.querySelector<HTMLElement>("#unity-progress-bar-full");
    if (progressBarFull) {
      progressBarFull.style.width = 100 * progress + "%";
    }
  }).then((unityInstance: UnityInstance) => {
    const loadingBar = document.querySelector<HTMLElement>("#unity-loading-bar");
    if (loadingBar) {
      loadingBar.style.display = "none";
    }
    
    const fullscreenButton = document.querySelector<HTMLElement>("#unity-fullscreen-button");
    if (fullscreenButton) {
      fullscreenButton.onclick = () => {
        unityInstance.SetFullscreen(1);
      };
    }
  }).catch((message: unknown) => {
    alert(message);
  });
};

document.body.appendChild(script);
