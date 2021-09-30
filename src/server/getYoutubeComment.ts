import axios from "axios";
import { parse } from "node-html-parser";

interface Options {
  key: string;
  continuation: string;
  visitorData: string;
  clientVersion: string;
}

export class Live {
  constructor();
  constructor(liveId: string);
  constructor(liveId?: string | null) {
    if (liveId) this.liveId = liveId;
    else this.liveId = "";
  }
  public channelId = "";
  public liveId = "";

  private options?: Options = undefined;

  private readonly headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 6.3; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/86.0.4240.111 Safari/537.36",
  };
  private chatUri = "https://www.youtube.com/live_chat";
  private apiEpUri =
    "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat";
  private pollingHandle?: NodeJS.Timer;

  /**
   * チャンネルIDから有効な配信URL引っこ抜いてくる
   * @param channelId
   */
  public static async getLiveFromChannelId(channelId: string) {
    // 単純にチャンネルURLの後ろに/live付ければライブのURLに飛べる
    // ついでによりパースしやすいembedページを利用する
    const uri = "https://www.youtube.com/embed/live_stream";

    const res = await axios
      .get(uri, {
        params: {
          channel: channelId,
        },
      })
      .catch((err) => err.response);

    if (res.status !== 200) return null;
    const root = parse(res.data).querySelectorAll("link");
    let vid = null;
    for (const v of root) {
      if (v.getAttribute("rel") === "canonical") {
        const href = v.getAttribute("href");
        if (href) {
          const match = href.match(/v=(.+)/);
          if (match && match.length >= 2) {
            vid = match[1];
          }
        }
      }
    }
    return vid;
  }

  /**
   * コメントポーリング開始
   * @param pollingIntervalMs
   */
  public begin(
    pollingIntervalMs: number,
    callbackLiveBegin: () => void,
    callbackCommentsReceived: (comments: Comment[]) => void
  ) {
    this.Logging("begin");
    if (this.liveId) {
      callbackLiveBegin();
      const closure = async () => {
        // 初回だけContinuation拾いに行く
        if (!this.options) {
          this.options = await this.fetchFirstLive(this.liveId);
        }

        // 初回パースが失敗してるかもなので馬鹿っぽいけど2度判定
        if (this.options) {
          const item = await this.fetchChat(this.options);
          if (
            item &&
            item.continuationContents &&
            item.continuationContents.liveChatContinuation
          ) {
            const { continuations, actions } =
              item.continuationContents.liveChatContinuation;

            // 新着コメントがあるならactionsアイテムがある
            if (actions) {
              const comments = this.buildCommentObject(actions);
              callbackCommentsReceived(comments);
            }

            // continuationを更新
            const icd = continuations[0].invalidationContinuationData;
            this.options.continuation = icd.continuation;
          } else {
            this.Logging("fetchChat()がゴミ返して来た");
          }
        } else {
          this.Logging("options 取得失敗");
        }
      };
      closure();
      this.pollingHandle = setInterval(closure, pollingIntervalMs);
    } else {
      throw new Error("liveIdかコールバックの設定忘れ");
    }
  }

  /**
   * コメントポーリング終了
   */
  public end() {
    if (this.pollingHandle) {
      clearInterval(this.pollingHandle);
    }
  }

  /**
   * postしてチャットアイテムを取得
   */
  async fetchChat(options: Options) {
    const params = {
      continuation: options.continuation,
      visitorData: options.visitorData,
      clientVersion: options.clientVersion,
    };

    const data = this.buildOptions(
      params.continuation,
      this.headers["user-agent"],
      params.clientVersion,
      params.visitorData
    );

    const res = await axios
      .post(this.apiEpUri, data, {
        headers: this.headers,
        params: {
          key: options.key,
        },
      })
      .catch((e) => e.response);

    if (res.status === 200) {
      return res.data;
    } else {
      return null;
    }
  }

  /**
   * postする為のパラメータを組み立てる
   */
  buildOptions(
    continuation: string,
    userAgent: string,
    clientVersion: string,
    visitorData: string
  ) {
    const ret = {
      context: {
        client: {
          visitorData,
          userAgent,
          clientName: "WEB",
          clientVersion,
        },
      },
      continuation,
    };
    return ret;
  }

  /**
   * 配信からContinuous Keyを抜く ついでにAPI Keyも抜く
   * @param videoId 配信ID
   */
  async fetchFirstLive(videoId: string): Promise<Options | undefined> {
    const res = await axios.get(this.chatUri, {
      headers: this.headers,
      params: { v: videoId },
    });

    // htmlの中にjsとかも書いてあって、見た感じRegex一発で抜ける…たぶん。
    const html: string = res.data;
    const matchedKey = html.match(/"INNERTUBE_API_KEY":"(.+?)"/);
    const matchedCtn = html.match(/"continuation":"(.+?)"/);
    const matchedVisitor = html.match(/"visitorData":"(.+?)"/);
    const matchedClient = html.match(/"clientVersion":"(.+?)"/);

    const matched = (obj: RegExpMatchArray | null) => {
      if (obj && obj.length >= 2) {
        return obj[1];
      }
      return undefined;
    };

    // なお2021/01/29現在、keyは↓ので固定っぽい
    // AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8
    const ret = {
      key: matched(matchedKey),
      continuation: matched(matchedCtn),
      visitorData: matched(matchedVisitor),
      clientVersion: matched(matchedClient),
    };

    // 一個でも抜けがあったらUndef返す
    if (Object.values(ret).includes(undefined)) {
      return undefined;
    } else {
      return ret as Options;
    }
  }

  /**
   * actionItemプロパティからコメントオブジェクト切り出して返す
   * @param actions data内のactions配列
   */
  private buildCommentObject(actions: any): Comment[] {
    // actions:[{addChatItemAction:{item:{...}}}]
    const ret: Array<Comment> = [];
    for (const actionItem of actions) {
      // addChatItemActionがあればコメントかスパチャ
      if ("addChatItemAction" in actionItem) {
        const item = actionItem.addChatItemAction.item;
        // コメント共通項目(実質スパチャは通常コメの上位互換)
        let common = null;
        let isSuperChat = false;

        // 通常コメの場合
        if ("liveChatTextMessageRenderer" in item) {
          common = item.liveChatTextMessageRenderer;
        }
        // スパチャの場合
        else if ("liveChatPaidMessageRenderer" in item) {
          common = item.liveChatPaidMessageRenderer;
          isSuperChat = true;
        }

        // 共通データ整形
        if (common) {
          ret
            .push
            // 自作コメントパーサを呼び出す 人によって扱いが違うので任せる
            // Comment.fromMessageRenderer(common, isSuperChat, this.liveId)
            ();
        }
      }
      // addLiveChatTickerItemActionがあればスーパーステッカー
      else if ("addLiveChatTickerItemAction" in actionItem) {
        // const item = actionItem.addLiveChatTickerItemAction.item
        // STUB よく知らん そもそも自分のチャンネル収益化してねぇ
      }
    }
    return ret;
  }

  /**
   * loggingラッパ デバッグ等にどうぞ
   * @param message
   */
  private Logging(message: string) {
    console.log(message);
  }
}
