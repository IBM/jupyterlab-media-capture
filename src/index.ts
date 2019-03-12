import { JupyterLab, JupyterLabPlugin } from "@jupyterlab/application";

import "../style/index.css";

import { NotebookActions, INotebookTracker } from "@jupyterlab/notebook";

import { ICommandPalette } from "@jupyterlab/apputils";

import { ContentsManager, Contents } from "@jupyterlab/services";

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IDocumentManager } from '@jupyterlab/docmanager';


/**
 * Initialization data for the jupyterlab_media_capture extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: "jupyterlab_media_capture",
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IFileBrowserFactory, IDocumentManager],
  activate: (
    app: JupyterLab,
    tracker: INotebookTracker,
    palette: ICommandPalette,
    browserFactory: IFileBrowserFactory,
    docManager: IDocumentManager,
  ) => {
    const command: string = "media:take-photo";

    let contents = new ContentsManager();

    app.commands.addCommand(command, {
      label: "Take webcam photo",
      execute: () => {
        console.log("taking picture");

        var video = document.createElement("video");
        video.id = "video";
        video.autoplay = true;
        video.hidden = true;

        var canvas = document.createElement("canvas");
        canvas.height = 1200;
        canvas.width = 1600;
        canvas.hidden = true;

        const context = canvas.getContext("2d");

        const constraints = {
          video: true
        };

        document.body.appendChild(video);

        navigator.mediaDevices
          .getUserMedia(constraints)
          .then(stream => {
            video.srcObject = stream;
            video.play;
            return new Promise(resolve => (video.onplaying = resolve));
          })
          .then(() => {
            setTimeout(() => { // wait for camera to adjust
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              var image = canvas.toDataURL();
              console.log(image);

              // let future = tracker.currentWidget.session.kernel.requestExecute({
              //   code: `image = ${image}`
              // });
              // future.done.then(() => {console.log('image available')});
              let name = `${Date.now()}.png`;
              let path = `${browserFactory.defaultBrowser.model.path}/${name}`;
              let model: Partial<Contents.IModel> = {
                type: 'file',
                format: 'base64',
                content: image.split(',')[1],
                path,
                name,
                mimetype: 'image/png',

              }

             

              contents.save(path, model).then((model) => {
                 if (tracker.currentWidget == null) {
                   // not in a notebook -- just open the image
                   docManager.open(path);
                } else {
                  console.log("inserting cell");
                  NotebookActions.insertBelow(tracker.currentWidget.content);
                  tracker.currentWidget.content.activeCell.model.value.text = 
`from matplotlib import pyplot as plt
import cv2

img = cv2.imread(".${path}")
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # fix color
plt.axis("off") # remove axes ticks
plt.imshow(img)
plt.show()`;
                  NotebookActions.run(tracker.currentWidget.content, tracker.currentWidget.session).then(result => {
                    console.log(result)
                  }).catch(err => {console.error(err)});
                }
              }).catch(err => {
                console.error("unable to save webcam image");
                console.error(err);
              });

              


              (<MediaStream>video.srcObject)
                .getVideoTracks()
                .forEach(track => track.stop());
              video.remove();
              canvas.remove();
            }, 1000);
          })
          .catch(err => {
            console.error(err);
          });


        
      }
    });

    palette.addItem({ command, category: "Media Capture" });
    console.log("JupyterLab extension jupyterlab_media_capture is activated!");
  }
};

export default extension;
