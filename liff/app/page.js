"use client";

import Head from "next/head";
import packageJson from "../package.json";
import { useLIFF } from "@/app/providers";
import { useEffect } from "react";

export default function Home() {
  const { liffObject, liffError } = useLIFF();

  // Optional: Example of using LIFF object if needed
  useEffect(() => {
    if (liffObject) {
      // You can perform LIFF-specific operations here
      console.log("LIFF Version:", liffObject.getVersion());
    }
  }, [liffObject]);

  return (
    <div>
      <Head>
        <title>LIFF Starter</title>
      </Head>
      <div className="home">
        <h1 className="home__title">
          Welcome to <br />
          <a
            className="home__title__link"
            href="https://developers.line.biz/en/docs/liff/overview/"
          >
            LIFF Starter!
          </a>
        </h1>
        <div className="home__badges">
          <span className="home__badges__badge badge--primary">
            LIFF Starter
          </span>
          <span className="home__badges__badge badge--secondary">nextjs</span>
          <span className="home__badges__badge badge--primary">
            {packageJson.version}
          </span>
          <a
            href="https://github.com/line/line-liff-v2-starter"
            target="_blank"
            rel="noreferrer"
            className="home__badges__badge badge--secondary"
          >
            GitHub
          </a>
        </div>
        <div className="home__buttons">
          <a
            href="https://developers.line.biz/en/docs/liff/developing-liff-apps/"
            target="_blank"
            rel="noreferrer"
            className="home__buttons__button button--primary"
          >
            LIFF Documentation
          </a>
          <a
            href="https://liff-playground.netlify.app/"
            target="_blank"
            rel="noreferrer"
            className="home__buttons__button button--tertiary"
          >
            LIFF Playground
          </a>
          <a
            href="https://developers.line.biz/console/"
            target="_blank"
            rel="noreferrer"
            className="home__buttons__button button--secondary"
          >
            LINE Developers Console
          </a>
        </div>

        {/* Optional: Add LIFF initialization status */}
        {liffError && (
          <div className="liff-error">
            LIFF Initialization Error: {liffError}
          </div>
        )}
      </div>
    </div>
  );
}
