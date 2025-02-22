import { distinctUntilChanged, map } from "rxjs/operators";
import { BehaviorSubject, Observable, Subscription, timer, of, lastValueFrom } from "rxjs";
import { IpcService } from "./ipc.service";
import { NotificationService } from "./notification.service";
import { CSSProperties } from "react";
import { ProgressionInterface } from "shared/models/progress-bar";
import { Progression } from "main/helpers/fs.helpers";

export class ProgressBarService {
    private static instance: ProgressBarService;

    private readonly ipcService: IpcService;
    private notificationService: NotificationService;

    private readonly _progression$: BehaviorSubject<ProgressionInterface>;
    private readonly _visible$: BehaviorSubject<boolean>;
    private readonly _style$: BehaviorSubject<CSSProperties>;

    private subscription: Subscription;

    public static getInstance(): ProgressBarService {
        if (!ProgressBarService.instance) {
            ProgressBarService.instance = new ProgressBarService();
        }
        return ProgressBarService.instance;
    }

    private constructor() {
        this.ipcService = IpcService.getInstance();
        this.notificationService = NotificationService.getInstance();

        this._progression$ = new BehaviorSubject<ProgressionInterface>({ progression: 0 });
        this._visible$ = new BehaviorSubject<boolean>(false);
        this._style$ = new BehaviorSubject<CSSProperties>(undefined);

        this.progress$.subscribe(value => this.setSystemProgression(value));
    }

    private setSystemProgression(progression: number) {
        lastValueFrom(this.ipcService.sendV2("window.progression", progression));
    }

    private subscribreTo(obs: Observable<ProgressionInterface | number | Progression>) {
        if (this.subscription) {
            this.unsubscribe();
        }
        this.subscription = obs.pipe(distinctUntilChanged()).subscribe(value => {
            if (typeof value === "number") {
                return this._progression$.next({ progression: value });
            }

            const isProgression = (progression: unknown): progression is Progression => {
                return typeof (progression as Progression).current === "number" && typeof (progression as Progression).total === "number";
            }

            if (isProgression(value)) {
                const progress = value.current / value.total * 100;
                return this._progression$.next({ progression: Math.floor(progress)});
            }

            this._progression$.next(value);
        });
    }

    private unsubscribe() {
        this._progression$.next({ progression: 0 });
        this.subscription?.unsubscribe();
        this.subscription = null;
    }

    public show(obs?: Observable<ProgressionInterface | number | Progression>, style?: CSSProperties) {

        this.unsubscribe();

        if (obs) {
            this.subscribreTo(obs);
        }
        this._visible$.next(true);

        if(style) {
            this._style$.next(style);
        }
    }

    public showFake(speed: number, style?: CSSProperties, label?: string): void {
        const obs: Observable<ProgressionInterface> = timer(1000, 100).pipe(
            map(val => {
                if (this._progression$.value.progression >= 100) {
                    return { progression: 100, label };
                }
                const currentProgress = speed * (val + 1);
                const progress = Math.round((Math.atan(currentProgress) / (Math.PI / 2)) * 100 * 1000) / 1000;
                return { progression: progress, label } as ProgressionInterface;
            })
        );
        this.show(obs, style);
    }

    public complete(): void {
        this._progression$.next({ progression: 100 });
    }

    public open(): void {
        this.show(of(0), this._style$.value);
    }

    public hide() {
        this.unsubscribe();
        this._visible$.next(false);
    }

    public require(): boolean {
        if (this.isVisible) {
            this.notificationService.notifyError({ title: "notifications.shared.errors.titles.operation-running", desc: "notifications.shared.errors.msg.operation-running", duration: 3000 });
            return false;
        }
        return true;
    }

    public setStyle(style: CSSProperties) {
        this._style$.next(style);
    }

    public get progressData$(): Observable<ProgressionInterface> {
        return this._progression$.asObservable();
    }
    public get progress$(): Observable<number> {
        return this._progression$.pipe(map(data => data.progression));
    }
    public get progressLabel(): Observable<string> {
        return this._progression$.pipe(map(data => data?.label));
    }

    public get visible$(): Observable<boolean> {
        return this._visible$.asObservable();
    }
    public get isVisible(): boolean {
        return this._visible$.value;
    }
    public get style$(): Observable<CSSProperties> {
        return this._style$.asObservable();
    }
}
