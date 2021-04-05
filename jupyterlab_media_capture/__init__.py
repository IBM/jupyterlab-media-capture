import json
from pathlib import Path

from ._version import __version__

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab_media_capture"
    }]


from .handlers import setup_handlers


def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_media_capture"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered HelloWorld extension at URL path /jupyterlab_media_capture")

# backwards compatibility with jupyterlab 2.0
load_jupyter_server_extension = _load_jupyter_server_extension
_jupyter_server_extension_paths = _jupyter_server_extension_points
