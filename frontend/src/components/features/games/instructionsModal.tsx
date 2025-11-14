import React, { Fragment } from "react";
import { X } from "lucide-react";

export const InstructionsModal: React.FC<{
    title: string;
    description: string;
    howToPlay: string;
    onClose: () => void;
}> = ({ title, description, howToPlay, onClose }) => {
    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Modal Panel */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="bg-white rounded-3xl w-full max-w-sm p-6">
                    <div className="flex justify-end items-center ">

                        <button onClick={onClose} className="text-red-500 hover:text-red-700">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="pt-2 flex flex-col justify-center items-center">
                        <h3 className="text-lg font-semibold">How to play {title}</h3>
                        <div className="p-4 overflow-y-auto text-center">
                            <div
                                className="prose prose-sm max-w-none text-gray-700 space-y-3 mb-4"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                            <div
                                className="prose prose-sm max-w-none text-gray-700 space-y-3"
                                dangerouslySetInnerHTML={{ __html: howToPlay }}
                            />
                        </div>

                        <div className="">
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-primary-900 shadow-[0_5px_0_0] hover:shadow-[0_3px_0_0] active:shadow-[0_1px_0_0] hover:translate-y-1 active:translate-y-2 transition-all"
                            >
                                Got It!
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </Fragment>
    );
};