const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-05802603-e444-4960-9560-e0aa1ba8f3b7',
    subscribeKey: 'sub-c-b3eae7b4-c921-11ec-92be-82b465a2b170',
    secretKey:'sec-c-NDcwNTI0OGItMjIwNy00NDY3LTlkMTktYzA4ZDMzYTI2M2Vm'
};

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor( { blockchain, transactionPool, wallet}) {
        this.blockchain = blockchain;
        this.wallet = wallet;
        this.transactionPool = transactionPool;

        this.pubnub = new PubNub(credentials);

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

        this.pubnub.addListener(this.listener());
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction){
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }

    subscribeToChannels() {
        this.pubnub.subscribe({
            channels: [Object.values(CHANNELS)]
        });
    }

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;

                console.log(`Message received. Channel: ${channel}. Message: ${message}`);

                const parsedMessage = JSON.parse(message);

                switch(channel) {
                    case CHANNELS.BLOCKCHAIN:
                      this.blockchain.replaceChain(parsedMessage, true, () => {
                          this.transactionPool.clearBlockchainTransactions({
                              chain: parsedMessage
                          });
                      });
                      break;
                    case CHANNELS.TRANSACTION:
                        if(!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                        })) {
                      this.transactionPool.setTransaction(parsedMessage);
                        }
                      break;
                    default:
                      return;
                  }
            }
        };
    }

    publish ({ channel, message }) {
        this.pubnub.publish({ channel, message });
    }
}

module.exports = PubSub;