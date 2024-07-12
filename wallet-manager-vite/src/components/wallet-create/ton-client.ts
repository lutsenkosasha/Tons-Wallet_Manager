import { TonClient } from "ton";

const getTonClient = (): TonClient => {
    return new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
        apiKey: "68fd4cb402a95c104ce77b04ee981e18800ec44842fdcabd21b021f6ce94bcc8"
    });
};

export default getTonClient;