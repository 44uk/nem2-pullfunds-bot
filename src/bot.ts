import {
  Account,
  AccountHttp,
  AggregateTransaction,
  CosignatureSignedTransaction,
  CosignatureTransaction,
  Listener,
  NetworkHttp,
  QueryParams,
  TransactionHttp,
  TransactionAnnounceResponse
} from 'nem2-sdk';
import { filter, map, mergeMap } from 'rxjs/operators';
import { pipe } from 'rxjs';

export default class Bot {
  private fundAccount: Account;
  private accountHttp: AccountHttp;
  private transactionHttp: TransactionHttp;
  private listener: Listener;

  constructor(
    private privateKey: string,
    private url: string = 'http://localhost:3000'
  ) {}

  start() {
    this.beforeStart().subscribe(
      () => {
        this.accountHttp
          .aggregateBondedTransactions(
            this.fundAccount.publicAccount,
            new QueryParams(100)
          )
          .pipe(
            mergeMap((_: AggregateTransaction[]) => _),
            this.pipeline()
          )
          .subscribe(this.subscription());

        this.listener.open().then(() => {
          this.listener
            .aggregateBondedAdded(this.fundAccount.address)
            .pipe(this.pipeline())
            .subscribe(this.subscription());
        });
      },
      err => console.error(err)
    );
    console.log('Bot started.');
  }

  stop() {
    this.listener.close();
    console.log('Bot stopped.');
  }

  restart() {
    this.stop();
    this.start();
    console.log('Bot restarted.');
  }

  beforeStart() {
    console.log('Fetching NetworkType...');
    const networkHttp = new NetworkHttp(this.url);
    return networkHttp.getNetworkType().pipe(
      map(networkType => {
        console.log('Detected NetworkType => %s', networkType);
        this.fundAccount = Account.createFromPrivateKey(
          this.privateKey,
          networkType
        );
        this.listener = new Listener(this.url);
        this.accountHttp = new AccountHttp(this.url);
        this.transactionHttp = new TransactionHttp(this.url);
      })
    );
  }

  subscription() {
    return {
      next: (announcedTransaction: TransactionAnnounceResponse) => {
        console.log(announcedTransaction.message);
      },
      error: err => {
        console.log(err.response !== undefined ? err.response.text : err);
      },
      complete: () => {}
    };
  }

  pipeline() {
    return pipe(
      filter(
        (_: AggregateTransaction) =>
          !_.signedByAccount(this.fundAccount.publicAccount)
      ),
      map((tx: AggregateTransaction) =>
        this.cosignAggregateBondedTransaction(tx, this.fundAccount)
      ),
      mergeMap((cosignatureSignedTx: CosignatureSignedTransaction) =>
        this.transactionHttp.announceAggregateBondedCosignature(
          cosignatureSignedTx
        )
      )
    );
  }

  cosignAggregateBondedTransaction(
    transaction: AggregateTransaction,
    signer: Account
  ): CosignatureSignedTransaction {
    const cosignatureTransaction = CosignatureTransaction.create(transaction);
    return signer.signCosignatureTransaction(cosignatureTransaction);
  }
}
