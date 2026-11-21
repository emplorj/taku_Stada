// 出力処理でのみ使う外部ライブラリを、必要になった時に読み込む。
// 既存と同じ配布元・版を使うため、カードの描画・座標計算は変えない。
(function () {
  const definitions = {
    html2canvas: {
      global: "html2canvas",
      src: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    },
    jszip: {
      global: "JSZip",
      src: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    },
    upng: {
      global: "UPNG",
      src: "https://unpkg.com/upng-js",
    },
  };
  const pending = new Map();

  function load(definition) {
    if (window[definition.global]) return Promise.resolve();
    if (pending.has(definition.global)) return pending.get(definition.global);

    const task = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = definition.src;
      script.async = true;
      script.onload = () =>
        window[definition.global]
          ? resolve()
          : reject(new Error(definition.global + " を初期化できませんでした。"));
      script.onerror = () =>
        reject(new Error(definition.global + " の読み込みに失敗しました。"));
      document.head.appendChild(script);
    });
    pending.set(definition.global, task);
    return task.finally(() => pending.delete(definition.global));
  }

  window.CG_DEPS = {
    ensure: async (...names) => {
      await Promise.all(
        names.map((name) => {
          const definition = definitions[name];
          if (!definition) throw new Error("未定義の出力ライブラリ: " + name);
          return load(definition);
        }),
      );
    },
  };
})();
