import express, { Express, Router } from 'express';
export type CustomRoutesCallback = (apiRouter: Router, app: Express) => void;
export declare function createApp(mountCustomRoutes?: CustomRoutesCallback): Express;
export declare const app: express.Express;
