'use strict';
/**
 * Created by LOLO on 2022/03/09.
 */


(() => {
    const gp_http_server = document.querySelector('#gp_http_server');
    const gp_http_port = document.querySelector('#gp_http_port');
    const gp_socks_server = document.querySelector('#gp_socks_server');
    const gp_socks_port = document.querySelector('#gp_socks_port');
    const gp_enabled = document.querySelector('#gp_enabled');

    const verifyParams = () => {
        return !isEmpty(gp_http_server.value) && !isEmpty(gp_socks_server.value)
            && !isNaN(gp_http_port.value) && !isNaN(gp_socks_port.value);
    }

    gp_http_server.onchange = gp_http_port.onchange = gp_socks_server.onchange = gp_socks_port.onchange = () => {
        if (verifyParams() && gp_enabled.checked) {
            gp_enabled.parentNode.MaterialSwitch.off();
            window.electron.send(window.electron.S.SET_LOCAL_PROXY);
        }
    };

    gp_enabled.onchange = () => {
        if (gp_enabled.checked) {
            if (verifyParams()) {
                window.electron.send(window.electron.S.SET_LOCAL_PROXY, {
                    http: {server: gp_http_server.value, port: parseInt(gp_http_port.value)},
                    socks: {server: gp_socks_server.value, port: parseInt(gp_socks_port.value)},
                });
            } else {
                showHint('params not valid.');
                gp_enabled.parentNode.MaterialSwitch.off();
            }
        } else {
            window.electron.send(window.electron.S.SET_LOCAL_PROXY);
        }
    }

    // 更新 enabled switch 状态
    window.electron.receive(window.electron.R.SWITCH_GLOBAL_PROXY, (enabled) => {
        let ms = gp_enabled.parentNode.MaterialSwitch;
        enabled ? ms.on() : ms.off();
    });


    // profile 有更新
    window.electron.receive(window.electron.R.UPDATE_PROFILE_DATA, (data) => {
        gp_http_server.value = data.proxies.http.server;
        gp_http_port.value = data.proxies.http.port;
        gp_socks_server.value = data.proxies.socks.server;
        gp_socks_port.value = data.proxies.socks.port;
        mdlTextFieldCheckDirty();
    });

    // 显示上次更新 geoip.dat & geosite.dat 的时间
    const lastUpdateTime = (time) => {
        let element = document.querySelector('.xray-core-last-update');
        element.textContent = 'Last Updated on ' + dayjs(time).format('LL');
    };

    // 显示 xray 的版本信息
    window.electron.receive(window.electron.R.UPDATE_XRAY_INFO, (data) => {
        document.querySelector('.xray-core-version').textContent = data.version;
        lastUpdateTime(data.lastUpdate);
    });


    // 更新 geoip.dat & geosite.dat
    let hideProgressId;
    const progress = document.querySelector('#xrayDatUpdateProgress');
    const updateBtn = document.querySelector('#xrayDatUpdateBtn');
    updateBtn.addEventListener('click', () => {
        clearTimeout(hideProgressId);
        progress.MaterialProgress.setProgress(0);
        progress.classList.remove(CSS_CLASS_HIDDEN);
        updateBtn.disabled = true;
        window.electron.send(window.electron.S.UPDATE_XRAY_DAT);
    });

    // 更新进度有变化
    window.electron.receive(window.electron.R.UPDATE_PROGRESS, (data) => {
        if (data.err) {
            showHint(`update ${data.err} fail!`, 3000);
        }
        if (data.end) {
            if (!data.err) {
                showHint('update geoip.dat & geosite.dat complete!', 3000);
                lastUpdateTime(Date.now());
                applyHint.show('geoip.dat & geosite.dat has changed.');
            }

            clearTimeout(hideProgressId);
            hideProgressId = setTimeout(() => {
                progress.classList.add(CSS_CLASS_HIDDEN);
                updateBtn.disabled = false;
            }, 3000);
        }
        progress.MaterialProgress.setProgress(data.progress);
    });
})();