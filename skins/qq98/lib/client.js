window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-skin-qq98",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0dsh-css:/Users/zcl/.dsh/source/staging-20260807T131726Z/packages/client/ui-skin-qq98/src/client/qq98.module.css.mjs
		const css = "body[data-dsh-retro]{--dsw-font-family:\"SimSun\", \"Songti SC\", \"NSimSun\", \"MS Sans Serif\", \"Microsoft YaHei\", sans-serif;--ds-font-family-code:\"Courier New\", \"SimSun\", \"Songti SC\", monospace;color:#000;box-sizing:border-box;background-color:teal;background-image:repeating-conic-gradient(#ffffff08 0% 25%,#0000 0% 50%);background-size:4px 4px;padding:34px 8px 32px}body[data-dsh-retro][data-ds-dark-theme]{color:#e4e4e4;background-color:#004040}body[data-dsh-retro] [id=root]{box-sizing:border-box;background:silver;border:1px solid #000;box-shadow:inset 2px 2px #dfdfdf,inset -2px -2px #404040}body[data-dsh-retro][data-ds-dark-theme] [id=root]{background:#333;box-shadow:inset 2px 2px #585858,inset -2px -2px #1a1a1a}body[data-dsh-retro]{--dsw-static-amber-100:#f8ecd9;--dsw-static-amber-400:#d69a3a;--dsw-static-amber-500:#b07600;--dsw-static-amber-600:#966300;--dsw-static-amber-900:#3f2f10;--dsw-static-blue-100:#d9e8f6;--dsw-static-blue-300:#a9c8e8;--dsw-static-blue-400:#7faede;--dsw-static-blue-450:#5d97d1;--dsw-static-blue-500:#3a7cc0;--dsw-static-blue-50:#eef4fb;--dsw-static-blue-50p:#e4eef8;--dsw-static-blue-600:#2e66a3;--dsw-static-blue-75:#e9f0f8;--dsw-static-blue-800:#1f4a7d;--dsw-static-blue-950:#122c4a;--dsw-static-deepseek-100:#d4e2f2;--dsw-static-deepseek-200:#bcd4ec;--dsw-static-deepseek-300:#9fc0e4;--dsw-static-deepseek-400:#6fa0d4;--dsw-static-deepseek-450:#4f8ccb;--dsw-static-deepseek-500:#2e6db4;--dsw-static-deepseek-50:#e8eef7;--dsw-static-deepseek-600:#25578f;--dsw-static-deepseek-700-delete:#1d3f66;--dsw-static-deepseek-800:#1d3f66;--dsw-static-deepseek-900:#162f4d;--dsw-static-green-100:#dff0df;--dsw-static-green-400:#58b058;--dsw-static-green-500:#2e8b2e;--dsw-static-green-900:#1e3f1e;--dsw-static-neutral-00:#fff;--dsw-static-neutral-1000:#000;--dsw-static-neutral-100:#efefef;--dsw-static-neutral-150:#e8e8e8;--dsw-static-neutral-200:#e0e0e0;--dsw-static-neutral-250:#d8d8d8;--dsw-static-neutral-300:#c8c8c8;--dsw-static-neutral-400:#a8a8a8;--dsw-static-neutral-500:#888;--dsw-static-neutral-50:#f5f5f5;--dsw-static-neutral-550:#787878;--dsw-static-neutral-600:#686868;--dsw-static-neutral-700:#505050;--dsw-static-neutral-800:#383838;--dsw-static-neutral-850:#303030;--dsw-static-neutral-900:#202020;--dsw-static-neutral-bluish-00:#fff;--dsw-static-neutral-bluish-1000:#000;--dsw-static-neutral-bluish-100:#e3e3e3;--dsw-static-neutral-bluish-150:#dcdcdc;--dsw-static-neutral-bluish-200:#d4d4d4;--dsw-static-neutral-bluish-300:silver;--dsw-static-neutral-bluish-400:#a0a0a0;--dsw-static-neutral-bluish-500:gray;--dsw-static-neutral-bluish-50:#f5f5f5;--dsw-static-neutral-bluish-600:#606060;--dsw-static-neutral-bluish-60:#f0f0f0;--dsw-static-neutral-bluish-700:#4f4f4f;--dsw-static-neutral-bluish-750:#404040;--dsw-static-neutral-bluish-75:#e9e9e9;--dsw-static-neutral-bluish-800:#333;--dsw-static-neutral-bluish-850:#2a2a2a;--dsw-static-neutral-bluish-875:#222;--dsw-static-neutral-bluish-900:#1a1a1a;--dsw-static-neutral-bluish-950:#111;--dsw-static-red-100:#f7d9d9;--dsw-static-red-400:#e05c5c;--dsw-static-red-500:#c00000;--dsw-static-red-50:#fbecec;--dsw-static-red-600:#a00000;--dsw-static-red-900:#5c1010}body[data-dsh-retro][data-ds-dark-theme]{--dsw-static-amber-100:#3a2d14;--dsw-static-amber-400:#d69a3a;--dsw-static-amber-500:#b07600;--dsw-static-amber-600:#966300;--dsw-static-amber-900:#3f2f10;--dsw-static-blue-100:#1f3a58;--dsw-static-blue-300:#2c4a6e;--dsw-static-blue-400:#3a5f8c;--dsw-static-blue-450:#4a73a6;--dsw-static-blue-500:#5d8fc4;--dsw-static-blue-50:#16283c;--dsw-static-blue-50p:#182c44;--dsw-static-blue-600:#6fa0d4;--dsw-static-blue-75:#1a2f47;--dsw-static-blue-800:#7faede;--dsw-static-blue-950:#a9c8e8;--dsw-static-deepseek-100:#1c2d47;--dsw-static-deepseek-200:#223653;--dsw-static-deepseek-300:#2b4365;--dsw-static-deepseek-400:#3c5f8f;--dsw-static-deepseek-450:#4f7fb8;--dsw-static-deepseek-500:#5d97d1;--dsw-static-deepseek-50:#17253a;--dsw-static-deepseek-600:#6fa0d4;--dsw-static-deepseek-700-delete:#7faede;--dsw-static-deepseek-800:#8fb4e0;--dsw-static-deepseek-900:#9fc0e4;--dsw-static-green-100:#243f24;--dsw-static-green-400:#58b058;--dsw-static-green-500:#2e8b2e;--dsw-static-green-900:#1e3f1e;--dsw-static-neutral-00:#262626;--dsw-static-neutral-1000:#efefef;--dsw-static-neutral-100:#3a3a3a;--dsw-static-neutral-150:#404040;--dsw-static-neutral-200:#464646;--dsw-static-neutral-250:#4d4d4d;--dsw-static-neutral-300:#555;--dsw-static-neutral-400:#6a6a6a;--dsw-static-neutral-500:gray;--dsw-static-neutral-50:#2c2c2c;--dsw-static-neutral-550:#8a8a8a;--dsw-static-neutral-600:#949494;--dsw-static-neutral-700:#a6a6a6;--dsw-static-neutral-800:#bcbcbc;--dsw-static-neutral-850:#c6c6c6;--dsw-static-neutral-900:#dadada;--dsw-static-neutral-bluish-00:#262626;--dsw-static-neutral-bluish-1000:#efefef;--dsw-static-neutral-bluish-100:#3a3a3a;--dsw-static-neutral-bluish-150:#404040;--dsw-static-neutral-bluish-200:#464646;--dsw-static-neutral-bluish-300:#555;--dsw-static-neutral-bluish-400:#6a6a6a;--dsw-static-neutral-bluish-500:gray;--dsw-static-neutral-bluish-50:#2c2c2c;--dsw-static-neutral-bluish-600:#949494;--dsw-static-neutral-bluish-60:#303030;--dsw-static-neutral-bluish-700:#a6a6a6;--dsw-static-neutral-bluish-750:#b0b0b0;--dsw-static-neutral-bluish-75:#353535;--dsw-static-neutral-bluish-800:#bcbcbc;--dsw-static-neutral-bluish-850:#c6c6c6;--dsw-static-neutral-bluish-875:#d0d0d0;--dsw-static-neutral-bluish-900:#dadada;--dsw-static-neutral-bluish-950:#e4e4e4;--dsw-static-red-100:#4a2222;--dsw-static-red-400:#e07070;--dsw-static-red-500:#d05050;--dsw-static-red-50:#3a1c1c;--dsw-static-red-600:#b84040;--dsw-static-red-900:#5c1010}body[data-dsh-retro]{--dsw-alias-bg-base:#fff;--dsw-alias-bg-layer-1:#f4f4f4;--dsw-alias-bg-layer-2:#ece9d8;--dsw-alias-bg-layer-3:#e0e0e0;--dsw-alias-bg-mask-1:#0006;--dsw-alias-bg-mask-2:#0003;--dsw-alias-bg-mask-3:#00000080;--dsw-alias-bg-mask-photo:#000000e0;--dsw-alias-bg-module-platform:#ece9d8;--dsw-alias-bg-multi-select:#e9e9e9;--dsw-alias-bg-overlay:#ece9d8;--dsw-alias-bg-skeleton:#0000000d;--dsw-alias-border-inverted2:#fff9;--dsw-alias-border-inverted:#fff6;--dsw-alias-border-l1:#00000026;--dsw-alias-border-l2-darkmode-thin:#0003;--dsw-alias-border-l2:#0003;--dsw-alias-border-l3:#0000004d;--dsw-alias-border-l4:#0006;--dsw-alias-brand-primary-invert:#fff;--dsw-alias-brand-primary-new-colorprimary-new-color:#2e6db4;--dsw-alias-brand-primary:#2e6db4;--dsw-alias-brand-text:navy;--dsw-alias-button-contrast-fill:#404040;--dsw-alias-button-elevated-fill:#fff;--dsw-alias-button-floating-fill:#fff;--dsw-alias-button-floating-hover:#e9e9e9;--dsw-alias-button-ghost-active-border:gray;--dsw-alias-button-ghost-active-fill:#dcdcdc;--dsw-alias-button-ghost-active-hover:#d0d0d0;--dsw-alias-button-info-fill:#2e6db4;--dsw-alias-button-info-hover:#3f7ec8;--dsw-alias-button-primary-dimmed:#dcdcdc;--dsw-alias-button-primary-fill:#2e6db4;--dsw-alias-button-primary-hover:#3f7ec8;--dsw-alias-button-tool-bar-fill-invisible:#6060605c;--dsw-alias-button-tool-bar-fill:#60606080;--dsw-alias-button-tool-bar-hover:#60606099;--dsw-alias-interactive-bg-active:#0040801f;--dsw-alias-interactive-bg-hover-accent:#00408029;--dsw-alias-interactive-bg-hover-danger:#c000000f;--dsw-alias-interactive-bg-hover-solid:#e9e9e9;--dsw-alias-interactive-bg-hover:#00408012;--dsw-alias-label-caption:gray;--dsw-alias-label-dimmed:#a0a0a0;--dsw-alias-label-primary-dimmed:#333;--dsw-alias-label-primary-foreground:#fff;--dsw-alias-label-primary-inverted:#fff;--dsw-alias-label-primary:#000;--dsw-alias-label-secondary:#333;--dsw-alias-label-tertiary:#555;--dsw-alias-markdown-citation:#e9e9e9;--dsw-alias-markdown-code-block-banner:#f4f4f4;--dsw-alias-markdown-code-block:#f4f4f4;--dsw-alias-markdown-code-segment-selected:#fff;--dsw-alias-markdown-code-segment-unselected:#ececec;--dsw-alias-markdown-inline-code:#e9e9e9;--dsw-alias-markdown-placeholder:#f0f0f0;--dsw-alias-markdown-tag:#ececec;--dsw-alias-scrollbar-bg-l1:silver;--dsw-alias-scrollbar-bg-l2:silver;--dsw-alias-scrollbar-hover-l1:#a8a8a8;--dsw-alias-scrollbar-hover-l2:#a8a8a8;--dsw-alias-state-business-primary:#2e6db4;--dsw-alias-state-business-tertiary:#d4e2f2;--dsw-alias-state-error-primary:#c00000;--dsw-alias-state-error-secondary:#e05c5c;--dsw-alias-state-success-primary:#2e8b2e;--dsw-alias-state-success-secondary:#58b058;--dsw-alias-state-success-tertiary:#dff0df;--dsw-alias-state-warn-label:#966300;--dsw-alias-state-warn-primary:#b07600;--dsw-alias-state-warn-secondary:#d69a3a;--dsw-alias-state-warn-tertiary:#f8ecd9;--dsw-alias-toast-bg:#404040;--dsw-alias-tooltip-bg:#ffffe1;--dsw-specific-bubble-highlight:#b8d4f0;--dsw-specific-bubble:#dce9f7;--dsw-specific-input-major:#fff;--dsw-specific-login-input:#fff;--dsw-specific-menu:#efefef;--dsw-specific-selector:#e9e9e9;--dsw-specific-sidebar-fill:#2e6db4;--dsw-specific-sidebar-nav-item-active-accent:#b8d4f0;--dsw-specific-sidebar-nav-item-active:#dce9f7;--dsw-specific-sidebar-nav-item-hover:#e9f0fa;--dsw-specific-tip:#f0f0f0}body[data-dsh-retro][data-ds-dark-theme]{--dsw-alias-bg-base:#2a2a2a;--dsw-alias-bg-layer-1:#303030;--dsw-alias-bg-layer-2:#353535;--dsw-alias-bg-layer-3:#3c3c3c;--dsw-alias-bg-mask-1:#00000080;--dsw-alias-bg-mask-2:#00000040;--dsw-alias-bg-mask-3:#0000008c;--dsw-alias-bg-mask-photo:#000000e0;--dsw-alias-bg-module-platform:#353535;--dsw-alias-bg-multi-select:#3a3a3a;--dsw-alias-bg-overlay:#353535;--dsw-alias-bg-skeleton:#ffffff0f;--dsw-alias-border-inverted2:#fff9;--dsw-alias-border-inverted:#fff6;--dsw-alias-border-l1:#ffffff1a;--dsw-alias-border-l2-darkmode-thin:#ffffff1f;--dsw-alias-border-l2:#ffffff29;--dsw-alias-border-l3:#ffffff3d;--dsw-alias-border-l4:#ffffff52;--dsw-alias-brand-primary-invert:#0a0a0a;--dsw-alias-brand-primary-new-colorprimary-new-color:#6fa0d4;--dsw-alias-brand-primary:#6fa0d4;--dsw-alias-brand-text:#9fc0e4;--dsw-alias-button-contrast-fill:silver;--dsw-alias-button-elevated-fill:#3a3a3a;--dsw-alias-button-floating-fill:#353535;--dsw-alias-button-floating-hover:#3f3f3f;--dsw-alias-button-ghost-active-border:#888;--dsw-alias-button-ghost-active-fill:#444;--dsw-alias-button-ghost-active-hover:#484848;--dsw-alias-button-info-fill:#25578f;--dsw-alias-button-info-hover:#2e66a3;--dsw-alias-button-primary-dimmed:#484848;--dsw-alias-button-primary-fill:#25578f;--dsw-alias-button-primary-hover:#2e66a3;--dsw-alias-button-tool-bar-fill-invisible:#b4b4b45c;--dsw-alias-button-tool-bar-fill:#b4b4b480;--dsw-alias-button-tool-bar-hover:#b4b4b499;--dsw-alias-interactive-bg-active:#b4c8e624;--dsw-alias-interactive-bg-hover-accent:#b4c8e633;--dsw-alias-interactive-bg-hover-danger:#e05c5c1f;--dsw-alias-interactive-bg-hover-solid:#3a3a3a;--dsw-alias-interactive-bg-hover:#ffffff12;--dsw-alias-label-caption:#8a8a8a;--dsw-alias-label-dimmed:#6a6a6a;--dsw-alias-label-primary-dimmed:#c6c6c6;--dsw-alias-label-primary-foreground:#fff;--dsw-alias-label-primary-inverted:#111;--dsw-alias-label-primary:#e4e4e4;--dsw-alias-label-secondary:#b8b8b8;--dsw-alias-label-tertiary:#949494;--dsw-alias-markdown-citation:#3a3a3a;--dsw-alias-markdown-code-block-banner:#2f2f2f;--dsw-alias-markdown-code-block:#2f2f2f;--dsw-alias-markdown-code-segment-selected:#3c3c3c;--dsw-alias-markdown-code-segment-unselected:#333;--dsw-alias-markdown-inline-code:#383838;--dsw-alias-markdown-placeholder:#303030;--dsw-alias-markdown-tag:#383838;--dsw-alias-scrollbar-bg-l1:#555;--dsw-alias-scrollbar-bg-l2:#555;--dsw-alias-scrollbar-hover-l1:#6a6a6a;--dsw-alias-scrollbar-hover-l2:#6a6a6a;--dsw-alias-state-business-primary:#5d97d1;--dsw-alias-state-business-tertiary:#223653;--dsw-alias-state-error-primary:#e05c5c;--dsw-alias-state-error-secondary:#e07070;--dsw-alias-state-success-primary:#58b058;--dsw-alias-state-success-secondary:#58b058;--dsw-alias-state-success-tertiary:#243f24;--dsw-alias-state-warn-label:#d69a3a;--dsw-alias-state-warn-primary:#d69a3a;--dsw-alias-state-warn-secondary:#d69a3a;--dsw-alias-state-warn-tertiary:#3a2d14;--dsw-alias-toast-bg:#505050;--dsw-alias-tooltip-bg:#ffffe1;--dsw-specific-bubble-highlight:#2b4365;--dsw-specific-bubble:#1f3a58;--dsw-specific-input-major:#2a2a2a;--dsw-specific-login-input:#2a2a2a;--dsw-specific-menu:#3a3a3a;--dsw-specific-selector:#383838;--dsw-specific-sidebar-fill:#1d4f8f;--dsw-specific-sidebar-nav-item-active-accent:#2b4365;--dsw-specific-sidebar-nav-item-active:#223653;--dsw-specific-sidebar-nav-item-hover:#26374f;--dsw-specific-tip:#333}body[data-dsh-retro] *{border-radius:3px!important}body[data-dsh-retro] button{box-shadow:-1px -1px #fff,1px 1px gray}body[data-dsh-retro] button:active:not(:disabled){box-shadow:-1px -1px gray,1px 1px #fff}body[data-dsh-retro][data-ds-dark-theme] button{box-shadow:-1px -1px gray,1px 1px #202020}body[data-dsh-retro][data-ds-dark-theme] button:active:not(:disabled){box-shadow:-1px -1px #202020,1px 1px gray}body[data-dsh-retro] input:not([type=checkbox]):not([type=radio]),body[data-dsh-retro] textarea,body[data-dsh-retro] select{color:#000;background:#fff;box-shadow:inset 1px 1px gray,inset -1px -1px #fff}body[data-dsh-retro][data-ds-dark-theme] input:not([type=checkbox]):not([type=radio]),body[data-dsh-retro][data-ds-dark-theme] textarea,body[data-dsh-retro][data-ds-dark-theme] select{color:#e4e4e4;background:#262626;box-shadow:inset 1px 1px #202020,inset -1px -1px gray}body[data-dsh-retro] :focus-visible{outline-offset:-1px;outline:1px dotted #000}body[data-dsh-retro]{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2)}body[data-dsh-retro] ::-webkit-scrollbar{width:14px;height:14px}body[data-dsh-retro] ::-webkit-scrollbar-track{background:#d4d0c8}body[data-dsh-retro] ::-webkit-scrollbar-thumb{background:silver;border:2px solid gray;border-color:#fff gray gray #fff;border-radius:0}body[data-dsh-retro] ::-webkit-scrollbar-thumb:hover{background:#a8a8a8}body[data-dsh-retro] ::-webkit-scrollbar-corner{background:#d4d0c8}body[data-dsh-retro][data-ds-dark-theme] ::-webkit-scrollbar-track,body[data-dsh-retro][data-ds-dark-theme] ::-webkit-scrollbar-corner{background:#303030}body[data-dsh-retro][data-ds-dark-theme] ::-webkit-scrollbar-thumb{background:#555;border-color:gray #202020 #202020 gray}body[data-dsh-retro][data-ds-dark-theme] ::-webkit-scrollbar-thumb:hover{background:#6a6a6a}body[data-dsh-retro] ::selection{color:#fff;background:navy}body[data-dsh-retro] a{color:#00e}body[data-dsh-retro] a:visited{color:#551a8b}body[data-dsh-retro][data-ds-dark-theme] a{color:#6fa0d4}body[data-dsh-retro][data-ds-dark-theme] a:visited{color:#7a6ab8}._1hchwa_retroTitlebar{z-index:1000000;color:#fff;user-select:none;background:linear-gradient(90deg,navy,#1084d0);border-bottom:1px solid #000;align-items:center;gap:6px;height:26px;padding:0 4px 0 6px;font:700 12px/26px SimSun,Songti SC,sans-serif;display:flex;position:fixed;top:0;left:0;right:0;box-shadow:inset 0 1px #ffffff59}._1hchwa_retroTitlebarTitle{white-space:nowrap;text-overflow:ellipsis;text-shadow:1px 1px #0006;flex:1;overflow:hidden}._1hchwa_retroTitlebarIcon{flex:none;align-items:center;display:inline-flex}._1hchwa_retroTitlebarBtn{color:#000;background:silver;border:1px solid #404040;border-color:#fff #404040 #404040 #fff;flex:none;justify-content:center;align-items:center;width:20px;height:17px;margin-left:2px;font-size:10px;line-height:1;display:inline-flex}body[data-dsh-retro][data-ds-dark-theme] ._1hchwa_retroTitlebarBtn{color:#e4e4e4;background:#404040;border-color:gray #202020 #202020 gray}._1hchwa_retroStatusbar{z-index:1000000;box-sizing:border-box;color:#000;user-select:none;background:silver;border-top:1px solid #000;align-items:center;gap:4px;height:22px;padding:2px;font:11px/1 SimSun,Songti SC,sans-serif;display:flex;position:fixed;bottom:0;left:0;right:0}body[data-dsh-retro][data-ds-dark-theme] ._1hchwa_retroStatusbar{color:#e4e4e4;background:#3a3a3a}._1hchwa_retroStatusbarCell{white-space:nowrap;background:#d4d0c8;border:1px solid #fff;border-color:gray #fff #fff gray;flex:none;height:16px;padding:0 8px;line-height:16px}body[data-dsh-retro][data-ds-dark-theme] ._1hchwa_retroStatusbarCell{background:#353535;border-color:#202020 gray gray #202020}._1hchwa_retroStatusbarSpacer{flex:1}body[data-dsh-retro] [data-pane=sidebar]>div{background:linear-gradient(#dcebf8 0%,#eef5fc 42%,#f8fbfe 100%)}body[data-dsh-retro][data-ds-dark-theme] [data-pane=sidebar]>div{background:linear-gradient(#223653 0%,#1c2d47 45%,#17253a 100%)}body[data-dsh-retro] [data-pane=sidebar]>div>:first-child,body[data-dsh-retro] [data-pane=sidebar]>div>:first-child *{color:#fff}body[data-dsh-retro] [data-pane=sidebar]>div>:first-child{background:linear-gradient(#1d4f8f,#2e6db4);border-bottom:1px solid #1d4f8f;box-shadow:inset 0 1px #ffffff40}body[data-dsh-retro][data-ds-dark-theme] [data-pane=sidebar]>div>:first-child{background:linear-gradient(#10253f,#1d4f8f);border-bottom-color:#10253f}body[data-dsh-retro] [data-pane=sidebar]>div>:first-child button{color:#fff;box-shadow:none;background:0 0}body[data-dsh-retro] [data-pane=sidebar]>div>:first-child button:hover{background:#ffffff2e}body[data-dsh-retro] [data-pane=sidebar]>div>:first-child svg rect[fill=currentColor]{fill:#122c4a}body[data-dsh-retro] [data-pane=sidebar]>div>:first-child svg [fill=\"var(--dsw-alias-label-primary-inverted)\"]{fill:#fff}body[data-dsh-retro] [data-pane=conversation]{background:#fff}body[data-dsh-retro][data-ds-dark-theme] [data-pane=conversation]{background:#2a2a2a}body[data-dsh-retro] [data-pane=conversation]>div>header{background:linear-gradient(#f2f7fc,#dce9f7);border-bottom:1px solid #b8c8d8}body[data-dsh-retro][data-ds-dark-theme] [data-pane=conversation]>div>header{background:linear-gradient(#223653,#1c2d47);border-bottom-color:#2b4365}body[data-dsh-retro] [data-pane=details]{background:#f2f2f2}body[data-dsh-retro][data-ds-dark-theme] [data-pane=details]{background:#2f2f2f}";
		const tagId = "@deepseek-ai/dsh-client-ui-skin-qq98/qq98.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-skin-qq98";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var qq98_module_css_default = {
			"retroStatusbar": "_1hchwa_retroStatusbar",
			"retroStatusbarSpacer": "_1hchwa_retroStatusbarSpacer",
			"retroTitlebarBtn": "_1hchwa_retroTitlebarBtn",
			"retroTitlebarTitle": "_1hchwa_retroTitlebarTitle",
			"retroTitlebarIcon": "_1hchwa_retroTitlebarIcon",
			"retroStatusbarCell": "_1hchwa_retroStatusbarCell",
			"retroTitlebar": "_1hchwa_retroTitlebar"
		};
		//#endregion
		//#region src/client/index.ts
		/** The product title the skin pins (captured by the shell's DocumentTitle after settle). */
		const SKIN_TITLE = "OICQ · DeepSeek 在线";
		/** Status bar cells; the spacer cell splits left and right groups. */
		const STATUS_CELLS = [
			"QQ 10000",
			"就绪",
			"已连接",
			"在线",
			"OICQ 1998 · 怀旧版"
		];
		/** Title bar window buttons (decorative glyphs, aria-hidden). */
		const TITLEBAR_GLYPHS = [
			"–",
			"□",
			"✕"
		];
		/**
		* Resolve one module class name. The css-modules record types as
		* `string | undefined` under noUncheckedIndexedAccess; every key used here
		* is a literal name in this package's own stylesheet, so the fallback is
		* unreachable in practice and only satisfies the indexed-access type.
		*/
		const cls = (name) => qq98_module_css_default[name] ?? "";
		/** OICQ-era penguin mark, inline so the skin carries no static assets. */
		const PENGUIN_SVG = [
			"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 48 48\" aria-hidden=\"true\">",
			"<ellipse cx=\"24\" cy=\"27\" rx=\"15\" ry=\"18\" fill=\"#1a1a2e\"/>",
			"<ellipse cx=\"24\" cy=\"31\" rx=\"9\" ry=\"13\" fill=\"#f5f5f5\"/>",
			"<ellipse cx=\"24\" cy=\"12\" rx=\"12\" ry=\"11\" fill=\"#1a1a2e\"/>",
			"<ellipse cx=\"24\" cy=\"14\" rx=\"8\" ry=\"6.5\" fill=\"#f5f5f5\"/>",
			"<circle cx=\"20\" cy=\"12\" r=\"2.2\" fill=\"#fff\"/><circle cx=\"20\" cy=\"12\" r=\"1.1\" fill=\"#000\"/>",
			"<circle cx=\"28\" cy=\"12\" r=\"2.2\" fill=\"#fff\"/><circle cx=\"28\" cy=\"12\" r=\"1.1\" fill=\"#000\"/>",
			"<polygon points=\"24,15 21,18 24,20 27,18\" fill=\"#ff8c00\"/>",
			"<ellipse cx=\"10.5\" cy=\"26\" rx=\"3.5\" ry=\"9\" fill=\"#1a1a2e\" transform=\"rotate(12 10.5 26)\"/>",
			"<ellipse cx=\"37.5\" cy=\"26\" rx=\"3.5\" ry=\"9\" fill=\"#1a1a2e\" transform=\"rotate(-12 37.5 26)\"/>",
			"<ellipse cx=\"19\" cy=\"45\" rx=\"5\" ry=\"2.6\" fill=\"#ff8c00\"/>",
			"<ellipse cx=\"29\" cy=\"45\" rx=\"5\" ry=\"2.6\" fill=\"#ff8c00\"/>",
			"</svg>"
		].join("");
		/**
		* Apply the QQ98 skin: body attribute, chrome bars, title, favicon. All
		* writes are retracted by the effect disposer on dispose.
		* @param ctx - owning context (the effect lifecycle owns retraction).
		*/
		function apply(ctx) {
			const body = document.body;
			const originalTitle = document.title;
			body.dataset.dshRetro = "";
			const titlebar = document.createElement("div");
			titlebar.className = cls("retroTitlebar");
			const icon = document.createElement("span");
			icon.className = cls("retroTitlebarIcon");
			icon.innerHTML = PENGUIN_SVG;
			const title = document.createElement("span");
			title.className = cls("retroTitlebarTitle");
			title.textContent = SKIN_TITLE;
			titlebar.append(icon, title);
			for (const glyph of TITLEBAR_GLYPHS) {
				const btn = document.createElement("span");
				btn.className = cls("retroTitlebarBtn");
				btn.setAttribute("aria-hidden", "true");
				btn.textContent = glyph;
				titlebar.append(btn);
			}
			const statusbar = document.createElement("div");
			statusbar.className = cls("retroStatusbar");
			const spacer = document.createElement("span");
			spacer.className = cls("retroStatusbarSpacer");
			statusbar.append(spacer);
			for (const cell of STATUS_CELLS) {
				const el = document.createElement("span");
				el.className = cls("retroStatusbarCell");
				el.textContent = cell;
				statusbar.append(el);
			}
			const favicon = document.createElement("link");
			favicon.rel = "icon";
			favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(PENGUIN_SVG)}`;
			document.head.append(favicon);
			document.title = SKIN_TITLE;
			body.append(titlebar, statusbar);
			ctx.effect(() => () => {
				delete body.dataset.dshRetro;
				titlebar.remove();
				statusbar.remove();
				favicon.remove();
				if (document.title === SKIN_TITLE) document.title = originalTitle;
			}, "ui-skin-qq98: retro chrome");
		}
		//#endregion
		exports.apply = apply;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map