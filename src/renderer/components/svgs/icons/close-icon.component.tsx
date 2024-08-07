import { createSvgIcon } from "../svg-icon.type";

export const CloseIcon = createSvgIcon((props, ref) => {
    return (
        <svg ref={ref} {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M480-416.348 287.826-224.174Q275.152-211.5 256-211.5t-31.826-12.674Q211.5-236.848 211.5-256t12.674-31.826L416.348-480 224.174-672.174Q211.5-684.848 211.5-704t12.674-31.826Q236.848-748.5 256-748.5t31.826 12.674L480-543.652l192.174-192.174Q684.848-748.5 704-748.5t31.826 12.674Q748.5-723.152 748.5-704t-12.674 31.826L543.652-480l192.174 192.174Q748.5-275.152 748.5-256t-12.674 31.826Q723.152-211.5 704-211.5t-31.826-12.674L480-416.348Z"/>
        </svg>
    );
});
