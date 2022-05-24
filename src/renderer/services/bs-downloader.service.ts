import { BehaviorSubject } from 'rxjs';
import { DownloadInfo } from '../../main/ipcs/bs-download-ipcs';
import { BSVersion } from '../../main/services/bs-version-manager.service'
import { BSVersionManagerService } from './bs-version-manager.service';
import { ModalExitCode, ModalService, ModalType } from './modale.service';

export class BsDownloaderService{

    private static instance: BsDownloaderService;

    private readonly modalService: ModalService = ModalService.getInsance();
    private readonly bsVersionManager: BSVersionManagerService = BSVersionManagerService.getInstance();

    private readonly downloadedVersions$: BehaviorSubject<BSVersion[]> = new BehaviorSubject([]);
    private readonly currentBsVersionDownload$: BehaviorSubject<BSVersion> = new BehaviorSubject(null);
    private readonly downloadProgress$: BehaviorSubject<number> = new BehaviorSubject(0);

    private constructor(){
        window.electron.ipcRenderer.on(`bs-download.[Password]`, async (bsVersion: BSVersion) => {
            const res = await this.modalService.openModal(ModalType.STEAM_LOGIN);
            if(res.exitCode !== ModalExitCode.COMPLETED){ return; }
            window.electron.ipcRenderer.sendMessage('bs-download.start', {bsVersion: bsVersion, username: res.data.username, password: res.data.password, stay: res.data.stay} as DownloadInfo)
            this.currentBsVersionDownload$.next(bsVersion);
        });

        window.electron.ipcRenderer.on("bs-download.[Guard]", async () => {
            const res = await this.modalService.openModal(ModalType.GUARD_CODE);
            if(res.exitCode != ModalExitCode.COMPLETED){ return; }
            window.electron.ipcRenderer.sendMessage("bs-download.[Guard]", res.data);
        });

        window.electron.ipcRenderer.on("bs-download.[Finished]", async () => {
            this.bsVersionManager.askInstalledVersions();
        });

        window.electron.ipcRenderer.on("bs-download.[Progress]", async (progress: number) => {
            this.downloadProgress$.next(progress);
        })
    }

    public static getInstance(){
        if(!BsDownloaderService.instance){ BsDownloaderService.instance = new BsDownloaderService(); }
        return BsDownloaderService.instance;
    }

    public async download(bsVersion: BSVersion){
        let username = localStorage.getItem("username");
        if(!username){
            const res = await this.modalService.openModal(ModalType.STEAM_LOGIN);
            if(res.exitCode !== ModalExitCode.COMPLETED){ return; }
            if(res.data.stay){ localStorage.setItem("username", res.data.username); }
            window.electron.ipcRenderer.sendMessage('bs-download.start', {bsVersion: bsVersion, username: res.data.username, password: res.data.password, stay: res.data.stay} as DownloadInfo);
        }
        else{
            window.electron.ipcRenderer.sendMessage('bs-download.start', {bsVersion: bsVersion, username: username} as DownloadInfo);
        }
        this.currentBsVersionDownload$.next(bsVersion);
    }

}