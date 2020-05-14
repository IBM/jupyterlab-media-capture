from setuptools import find_packages
from setuptools import setup

data_files_spec = [
    (
        "etc/jupyter/jupyter_notebook_config.d",
        "jupyter-config/jupyter_notebook_config.d",
        "jupyterlab_media_capture.json",
    ),
]

setup_dict = dict(
    name="jupyterlab_media_capture",
    packages=find_packages(),
    author="James Reeve",
    author_email="james.reeve@ibm.com",
    install_requires=["notebook"],
)

setup(version="0.2.8", **setup_dict)
