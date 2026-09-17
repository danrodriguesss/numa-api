import { app } from "./app.js";

const start = async () => {
    try {
        await app.listen({ port: 3333, host: "0.0.0.0" });
        console.log("Servidor Numa rodando em http://localhost:3333");
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

start();
